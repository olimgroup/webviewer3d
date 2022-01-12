

import * as pc from "playcanvas";
import {
  createNodes,
  createScenes,
  createCameras,
  createLights,
  createMaterials
} from "./gltfConverter";

export class GlbContainerAssets {
  private options: any;
  private gltf: any;
  public nodes: pc.Entity[] = [];
  public scenes: pc.Entity[] = [];
  public cameras: pc.CameraComponent[] = [];
  public lights: pc.LightComponent[] = [];
  public materials: pc.Asset[] = [];
  public textures: pc.Asset[] = [];

  constructor(gltf: any, options: any, textureAssets: pc.Asset[]) {
    this.options = options;
    this.gltf = gltf;
    this.textures = textureAssets;
  }
  public generate() {
    this.nodes = createNodes(this.gltf, this.options);
    this.scenes = createScenes(this.gltf, this.nodes, this.options);
    this.cameras = createCameras(this.gltf, this.nodes, this.options);
    this.lights = createLights(this.gltf, this.nodes, this.options);
    this.materials = createMaterials(this.gltf, this.textures.map((asset) => {
      return asset.resource;
    }), this.options, true);
  }
}

let gltfTextureUniqueId = 0;
export class CustomGltfLoader implements pc.ResourceHandler {

  static _http: pc.Http;
  static get http(): pc.Http {
    if (!this._http)
      this._http = new pc.Http();
    return this._http;
  }

  static get app(): pc.Application {
    return pc.Application.getApplication()!;
  }

  private _defaultMaterial!: pc.StandardMaterial;
  public get defaultMaterial(): pc.StandardMaterial {
    var mode = new pc.Model();
    if (!this._defaultMaterial)
      this._defaultMaterial = new pc.StandardMaterial();
    return this._defaultMaterial;
  }

  private parseGlb(glbData: ArrayBuffer, callback: pc.callbacks.ResourceHandler) {
    var data = new DataView(glbData);
    var magic = data.getUint32(0, true);
    var version = data.getUint32(4, true);
    var length = data.getUint32(8, true);
    if (magic !== 0x46546C67) {
      callback("Invalid magic number found in glb header. Expected 0x46546C67, found 0x" + magic.toString(16));
      return;
    }
    if (version !== 2) {
      callback("Invalid version number found in glb header. Expected 2, found " + version);
      return;
    }
    if (length <= 0 || length > glbData.byteLength) {
      callback("Invalid length found in glb header. Found " + length);
      return;
    }
    var chunks = [];
    var offset = 12;
    while (offset < length) {
      var chunkLength = data.getUint32(offset, true);
      if (offset + chunkLength + 8 > glbData.byteLength) {
        throw new Error("Invalid chunk length found in glb. Found " + chunkLength);
      }
      var chunkType = data.getUint32(offset + 4, true);
      var chunkData = new Uint8Array(glbData, offset + 8, chunkLength);
      chunks.push({ length: chunkLength, type: chunkType, data: chunkData });
      offset += chunkLength + 8;
    }
    if (chunks.length !== 1 && chunks.length !== 2) {
      callback("Invalid number of chunks found in glb file.");
      return;
    }
    if (chunks[0].type !== 0x4E4F534A) {
      callback("Invalid chunk type found in glb file. Expected 0x4E4F534A, found 0x" + chunks[0].type.toString(16));
      return;
    }
    if (chunks.length > 1 && chunks[1].type !== 0x004E4942) {
      callback("Invalid chunk type found in glb file. Expected 0x004E4942, found 0x" + chunks[1].type.toString(16));
      return;
    }
    callback(null, {
      gltfChunk: chunks[0].data,
      binaryChunk: chunks.length === 2 ? chunks[1].data : null
    });
  };

  private parseAsync(
    filename: string,
    urlBase: string,
    data: ArrayBuffer,
    device: pc.GraphicsDevice,
    defaultMaterial: pc.StandardMaterial,
    registry: pc.AssetRegistry,
    options: {},
    callback: pc.callbacks.ResourceHandler) {

    this.parseChunk(filename, data, (err, chunks) => {
      if (err) {
        callback(err);
        return;
      }
      this.parseGltf(chunks.gltfChunk, (err, gltf) => {
        if (err) {
          callback(err);
          return;
        }
        this.loadBuffersAsync(gltf, chunks.binaryChunk, urlBase, options, (err, buffers) => {
          if (err) {
            callback(err);
            return;
          }
          this.parseBufferViewsAsync(gltf, buffers, options, (err, bufferViews) => {
            if (err) {
              callback(err);
              return;
            }
            this.loadTexturesAsync(gltf, bufferViews, urlBase, registry, options, (err, textureAssets) => {
              if (err) {
                callback(err);
                return;
              }
              this.createResources(CustomGltfLoader.app.graphicsDevice, gltf, bufferViews, textureAssets, this.defaultMaterial, options, callback);
            })
          });
        });
      });
    });
  }

  private parseChunk(filename: string, data: ArrayBuffer, callback: pc.callbacks.ResourceHandler) {
    if (filename && filename.toLowerCase().endsWith('.glb')) {
      this.parseGlb(data, callback);
    } else {
      callback(null, {
        gltfChunk: data,
        binaryChunk: null
      });
    }
  }

  private parseGltf(gltfChunk: ArrayBuffer, callback: pc.callbacks.ResourceHandler) {
    var decodeBinaryUtf8 = function (array: any) {
      if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder().decode(array);
      }
      var str = "";
      for (var i = 0; i < array.length; i++) {
        str += String.fromCharCode(array[i]);
      }
      return decodeURIComponent(escape(str));
    };

    var gltf = JSON.parse(decodeBinaryUtf8(gltfChunk));
    if (gltf.asset && gltf.asset.version && parseFloat(gltf.asset.version) < 2) {
      callback("Invalid gltf version. Expected version 2.0 or above but found version '" + gltf.asset.version + "'.");
      return;
    }
    callback(null, gltf);
  };

  private loadBuffersAsync(gltf: any, binaryChunk: Uint8Array, urlBase: string, options: any, callback: pc.callbacks.ResourceHandler) {
    var isDataURI = function (uri: string) {
      return /^data:.*,.*$/i.test(uri);
    };
    const result: Uint8Array[] = [];
    if (gltf.buffers === null || gltf.buffers.length === 0) {
      callback(null, result);
      return;
    }
    var preprocess = options && options.buffer && options.buffer.preprocess;
    var processAsync = (options && options.buffer && options.buffer.processAsync) || function (gltfBuffer: ArrayBuffer, callback: any) {
      callback(null, null);
    };
    var postprocess = options && options.buffer && options.buffer.postprocess;
    var remaining = gltf.buffers.length;
    var onLoad = function (index: number, buffer: Uint8Array) {
      result[index] = buffer;
      if (postprocess) {
        postprocess(gltf.buffers[index], buffer);
      }
      if (--remaining === 0) {
        callback(null, result);
      }
    };
    for (var i = 0; i < gltf.buffers.length; ++i) {
      var gltfBuffer = gltf.buffers[i];
      if (preprocess) {
        preprocess(gltfBuffer);
      }
      processAsync(gltfBuffer, function (i: number, gltfBuffer: any, err: any, arrayBuffer: ArrayBuffer) {
        if (err) {
          callback(err);
        } else if (arrayBuffer) {
          onLoad(i, new Uint8Array(arrayBuffer));
        } else {
          if (gltfBuffer.hasOwnProperty('uri')) {
            if (isDataURI(gltfBuffer.uri)) {
              var byteString = atob(gltfBuffer.uri.split(',')[1]);
              var binaryArray = new Uint8Array(byteString.length);
              for (var j = 0; j < byteString.length; j++) {
                binaryArray[j] = byteString.charCodeAt(j);
              }
              onLoad(i, binaryArray);
            } else {
              CustomGltfLoader.http.get(
                pc.path.join(urlBase, gltfBuffer.uri),
                { cache: true, responseType: 'arraybuffer', retry: false },
                function (i: number, err: any, result: ArrayBuffer) {
                  if (err) {
                    callback(err);
                  } else {
                    onLoad(i, new Uint8Array(result));
                  }
                }.bind(null, i)
              );
            }
          } else {
            onLoad(i, binaryChunk);
          }
        }
      }.bind(null, i, gltfBuffer));
    }
  };

  private parseBufferViewsAsync(gltf: any, buffers: Uint8Array[], options: any, callback: pc.callbacks.ResourceHandler) {
    var result: any[] = [];
    var preprocess = options && options.bufferView && options.bufferView.preprocess;
    var processAsync = (options && options.bufferView && options.bufferView.processAsync) || function (gltfBufferView: Uint8Array, buffers: Uint8Array[], callback: pc.callbacks.ResourceHandler) {
      callback(null, null);
    };
    var postprocess = options && options.bufferView && options.bufferView.postprocess;
    var remaining = gltf.bufferViews.length;
    var onLoad = function (index: any, bufferView: any) {
      var gltfBufferView = gltf.bufferViews[index];
      if (gltfBufferView.hasOwnProperty('byteStride')) {
        bufferView.byteStride = gltfBufferView.byteStride;
      }
      result[index] = bufferView;
      if (postprocess) {
        postprocess(gltfBufferView, bufferView);
      }
      if (--remaining === 0) {
        callback(null, result);
      }
    };
    for (var i = 0; i < gltf.bufferViews.length; ++i) {
      var gltfBufferView = gltf.bufferViews[i];
      if (preprocess) {
        preprocess(gltfBufferView);
      }
      processAsync(gltfBufferView, buffers, function (i: any, gltfBufferView: any, err: any, result: any[]) {
        if (err) {
          callback(err);
        } else if (result) {
          onLoad(i, result);
        } else {
          var buffer = buffers[gltfBufferView.buffer];
          var typedArray = new Uint8Array(buffer.buffer,
            buffer.byteOffset + (gltfBufferView.hasOwnProperty('byteOffset') ? gltfBufferView.byteOffset : 0),
            gltfBufferView.byteLength);
          onLoad(i, typedArray);
        }
      }.bind(null, i, gltfBufferView));
    }
  };

  private loadTexturesAsync(gltf: any, bufferViews: Uint8Array[], urlBase: string, registry: pc.AssetRegistry, options: any, callback: pc.callbacks.ResourceHandler) {
    var isDataURI = function (uri: string) {
      return /^data:.*,.*$/i.test(uri);
    };
    var getDataURIMimeType = function (uri: string) {
      return uri.substring(uri.indexOf(":") + 1, uri.indexOf(";"));
    };
    const loadImageAsync = function (gltfImage: any, index: any, bufferViews: any, urlBase: any, registry: any, options: any, callback: any) {
      const preprocess = options && options.image && options.image.preprocess;
      const processAsync = (options && options.image && options.image.processAsync) || function (gltfImage: any, callback: any) {
        callback(null, null);
      };
      const postprocess = options && options.image && options.image.postprocess;

      const onLoad = function (textureAsset: any) {
        if (postprocess) {
          postprocess(gltfImage, textureAsset);
        }
        callback(null, textureAsset);
      };

      const mimeTypeFileExtensions: any[string] = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/basis': 'basis',
        'image/ktx': 'ktx',
        'image/ktx2': 'ktx2',
        'image/vnd-ms.dds': 'dds'
      };

      const loadTexture = function (url: any, bufferView: any, mimeType: any, options: any) {
        const name = (gltfImage.name || 'gltf-texture') + '-' + gltfTextureUniqueId++;

        // construct the asset file
        const file: any = {
          url: url || name
        };
        if (bufferView) {
          file.contents = bufferView.slice(0).buffer;
        }
        if (mimeType) {
          const extension = mimeTypeFileExtensions[mimeType];
          if (extension) {
            file.filename = file.url + '.' + extension;
          }
        }

        // create and load the asset
        const asset = new pc.Asset(name, 'texture', file, null, options);
        asset.on('load', onLoad);
        asset.on('error', callback);
        registry.add(asset);
        registry.load(asset);
      };

      if (preprocess) {
        preprocess(gltfImage);
      }

      processAsync(gltfImage, function (err: any, textureAsset: any) {
        if (err) {
          callback(err);
        } else if (textureAsset) {
          onLoad(textureAsset);
        } else {
          if (gltfImage.hasOwnProperty('uri')) {
            // uri specified
            if (isDataURI(gltfImage.uri)) {
              loadTexture(gltfImage.uri, null, getDataURIMimeType(gltfImage.uri), null);
            } else {
              loadTexture(pc.path.join(urlBase, gltfImage.uri), null, null, { crossOrigin: "anonymous" });
            }
          } else if (gltfImage.hasOwnProperty('bufferView') && gltfImage.hasOwnProperty('mimeType')) {
            // bufferview
            loadTexture(null, bufferViews[gltfImage.bufferView], gltfImage.mimeType, null);
          } else {
            // fail
            callback("Invalid image found in gltf (neither uri or bufferView found). index=" + index);
          }
        }
      });
    };

    const applySampler = function (texture: any, gltfSampler: any) {
      const getFilter = function (filter: any, defaultValue: any) {
        switch (filter) {
          case 9728: return pc.FILTER_NEAREST;
          case 9729: return pc.FILTER_LINEAR;
          case 9984: return pc.FILTER_NEAREST_MIPMAP_NEAREST;
          case 9985: return pc.FILTER_LINEAR_MIPMAP_NEAREST;
          case 9986: return pc.FILTER_NEAREST_MIPMAP_LINEAR;
          case 9987: return pc.FILTER_LINEAR_MIPMAP_LINEAR;
          default: return defaultValue;
        }
      };

      const getWrap = function (wrap: any, defaultValue: any) {
        switch (wrap) {
          case 33071: return pc.ADDRESS_CLAMP_TO_EDGE;
          case 33648: return pc.ADDRESS_MIRRORED_REPEAT;
          case 10497: return pc.ADDRESS_REPEAT;
          default: return defaultValue;
        }
      };

      if (texture) {
        gltfSampler = gltfSampler || {};
        texture.minFilter = getFilter(gltfSampler.minFilter, pc.FILTER_LINEAR_MIPMAP_LINEAR);
        texture.magFilter = getFilter(gltfSampler.magFilter, pc.FILTER_LINEAR);
        texture.addressU = getWrap(gltfSampler.wrapS, pc.ADDRESS_REPEAT);
        texture.addressV = getWrap(gltfSampler.wrapT, pc.ADDRESS_REPEAT);
      }
    };
    const cloneTexture = function (texture: any) {
      const shallowCopyLevels = function (texture: any) {
        const result = [];
        for (let mip = 0; mip < texture._levels.length; ++mip) {
          let level = [];
          if (texture.cubemap) {
            for (let face = 0; face < 6; ++face) {
              level.push(texture._levels[mip][face]);
            }
          } else {
            level = texture._levels[mip];
          }
          result.push(level);
        }
        return result;
      };
      const result = new pc.Texture(texture.device, texture) as any;   // duplicate texture
      result._levels = shallowCopyLevels(texture);            // shallow copy the levels structure
      return result;
    };
    const cloneTextureAsset = function (src: any) {
      const result = new pc.Asset(src.name + '_clone',
        src.type,
        src.file,
        src.data,
        src.options);
      result.loaded = true;
      result.resource = cloneTexture(src.resource);
      src.registry.add(result);
      return result;
    };

    if (!gltf.hasOwnProperty('images') || gltf.images.length === 0 ||
      !gltf.hasOwnProperty('textures') || gltf.textures.length === 0) {
      callback(null, []);
      return;
    }

    const preprocess = options && options.texture && options.texture.preprocess;
    const processAsync = (options && options.texture && options.texture.processAsync) || function (gltfTexture: any, gltfImages: any, callback: any) {
      callback(null, null);
    };
    const postprocess = options && options.texture && options.texture.postprocess;

    const assets: pc.Asset[] = [];        // one per image
    const textures: any[] = [];      // list per image

    let remaining = gltf.textures.length;
    const onLoad = function (textureIndex: number, imageIndex: number) {
      if (!textures[imageIndex]) {
        textures[imageIndex] = [];
      }
      textures[imageIndex].push(textureIndex);

      if (--remaining === 0) {
        const result: pc.Asset[] = [];
        textures.forEach(function (textureList, imageIndex) {
          textureList.forEach(function (textureIndex: number, index: number) {
            const textureAsset = (index === 0) ? assets[imageIndex] : cloneTextureAsset(assets[imageIndex]);
            applySampler(textureAsset.resource, (gltf.samplers || [])[gltf.textures[textureIndex].sampler]);
            result[textureIndex] = textureAsset;
            if (postprocess) {
              postprocess(gltf.textures[textureIndex], textureAsset);
            }
          });
        });
        callback(null, result);
      }
    };

    for (let i = 0; i < gltf.textures.length; ++i) {
      const gltfTexture = gltf.textures[i];

      if (preprocess) {
        preprocess(gltfTexture);
      }

      processAsync(gltfTexture, gltf.images, function (i: any, gltfTexture: any, err: any, gltfImageIndex: any) {
        if (err) {
          callback(err);
        } else {
          if (gltfImageIndex === undefined || gltfImageIndex === null) {
            gltfImageIndex = gltfTexture?.extensions?.KHR_texture_basisu?.source;
            if (gltfImageIndex === undefined) {
              gltfImageIndex = gltfTexture.source;
            }
          }

          if (assets[gltfImageIndex]) {
            // image has already been loaded
            onLoad(i, gltfImageIndex);
          } else {
            // first occcurrence, load it
            const gltfImage = gltf.images[gltfImageIndex];
            loadImageAsync(gltfImage, i, bufferViews, urlBase, registry, options, function (err: any, textureAsset: any) {
              if (err) {
                callback(err);
              } else {
                assets[gltfImageIndex] = textureAsset;
                onLoad(i, gltfImageIndex);
              }
            });
          }
        }
      }.bind(null, i, gltfTexture));
    }
  };

  private createResources(
    device: pc.GraphicsDevice,
    gltf: any,
    bufferViews: Uint8Array[],
    textureAssets: pc.Asset[],
    defaultMaterial: pc.StandardMaterial,
    options: any,
    callback: pc.callbacks.ResourceHandler) {
    var preprocess = options && options.global && options.global.preprocess;
    var postprocess = options && options.global && options.global.postprocess;
    if (preprocess) {
      preprocess(gltf);
    }
    var disableFlipV = gltf.asset && gltf.asset.generator === 'PlayCanvas';

    var result = new GlbContainerAssets(gltf, options, textureAssets);
    result.generate();
    if (postprocess) {
      postprocess(gltf, result);
    }
    callback(null, result);
  };

  parseData(
    url: { load: string; original: string; },
    arrayBuffer: ArrayBuffer,
    asset: pc.Asset,
    callback: pc.callbacks.ResourceHandler) {
    const _getUrlWithoutParams = function (url: string) {
      return url.indexOf('?') >= 0 ? url.split('?')[0] : url;
    }
    this.parseAsync(
      _getUrlWithoutParams(url.original),
      pc.path.extractPath(url.load),
      arrayBuffer,
      CustomGltfLoader.app.graphicsDevice,
      this.defaultMaterial,
      asset.registry,
      asset.options,
      function (err, result) {
        if (err) {
          callback(err);
        } else {
          callback(null, result);
        }
      });
  }

  load(
    url: { load: string; original: string; },
    callback: pc.callbacks.ResourceHandler,
    asset: pc.Asset): void {
    if (asset && asset.file && asset.file.contents) {
      this.parseData(url, asset.file.contents, asset, callback);
    } else {
      CustomGltfLoader.http.get(url.load, {
        responseType: 'arraybuffer',
        retry: false
      }, (err: number | string | Error | null, response?: any) => {
        if (!callback)
          return;
        if (err) {
          callback("Error loading model: " + url.original + " [" + err + "]");
        } else {
          this.parseData(url, response, asset, callback);
        }
      });
    }
  }

  open(url: string, data: any, asset?: pc.Asset): any {
    return data;
  }
  patch(asset: pc.Asset, assets: pc.AssetRegistry): void {
  }
}