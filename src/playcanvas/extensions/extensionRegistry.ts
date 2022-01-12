
import * as pc from "playcanvas";

type ExtensionData = any;
type ExtensionDataByName = { [extension: string]: ExtensionData };
type ObjectData = { extensions?: ExtensionDataByName };
type GltfData = any;
type ContainerAssetOptions = any;

type TextureAsset = Omit<pc.Asset, "resource"> & { resource: pc.Texture };

export type ExtensionPostParseCallback<
  TObject,
  TExtData = ExtensionData,
  TGltfData = GltfData
  > = (
    object: TObject,
    extensionData: TExtData,
    gltfData: TGltfData,
  ) => void;

export type ExtensionParsersByCallOrder<
  TObject,
  TExtData = ExtensionData,
  TGltfData = GltfData
  > = {
    postParse?: ExtensionPostParseCallback<TObject, TExtData, TGltfData>;
  };

export type ExtensionParsersByName<TObject> = {
  [extension: string]: ExtensionParsersByCallOrder<TObject>;
};

export class ExtensionParserCallbackRegistry<TObject> {
  private _extensions: ExtensionParsersByName<TObject> = {};

  public constructor() {
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.find = this.find.bind(this);
    this.index = this.index.bind(this);
    this.postParse = this.postParse.bind(this);
  }

  public add<TExtData, TRootExtData>(
    name: string,
    parsers: ExtensionParsersByCallOrder<TObject, TExtData, TRootExtData>,
  ) {
    if (this._extensions[name]) {
      return false;
    }
    this._extensions[name] = parsers;
    return true;
  }

  public remove(name: string) {
    if (!this._extensions[name]) {
      return;
    }
    delete this._extensions[name];
  }

  public removeAll() {
    this._extensions = {};
  }

  public find(name: string) {
    if (!this._extensions[name]) {
      return undefined;
    }
    return this._extensions[name];
  }

  public index() {
    return this._extensions;
  }

  public postParse(
    object: TObject,
    extensionDataByName: ExtensionDataByName = {},
    gltfData: GltfData = {},
  ) {
    const extensionParsers = this._extensions;

    Object.keys(extensionDataByName).forEach(extensionId => {

      const extensionParser = extensionParsers[extensionId];
      if (extensionParser && extensionParser.postParse) {
        extensionParser.postParse(
          object,
          extensionDataByName[extensionId],
          gltfData,
        );
      }
    });
  }
}

export class ExtensionRegistry {
  public _node = new ExtensionParserCallbackRegistry<pc.Entity>();
  private _scene = new ExtensionParserCallbackRegistry<pc.Entity>();
  private _camera = new ExtensionParserCallbackRegistry<pc.CameraComponent>();
  private _texture = new ExtensionParserCallbackRegistry<pc.Texture>();
  private _material = new ExtensionParserCallbackRegistry<pc.Material>();

  public constructor() {
    this.removeAll = this.removeAll.bind(this);
  }

  // public get node(): ExtensionParserCallbackRegistry<pc.Entity> {
  //   return this._node;
  // }

  // public get scene() {
  //   return this._scene;
  // }

  // public get camera() {
  //   return this._camera;
  // }

  // public get texture() {
  //   return this._texture;
  // }

  // public get material(): ExtensionParserCallbackRegistry<pc.Material> {
  //   return this._material;
  // }



  public get containerAssetOptions(): ContainerAssetOptions {
    let gltfData: GltfData | undefined;


    function createPostProcessHandler<T>(registry: ExtensionParserCallbackRegistry<T>) {
      return (objectData: ObjectData, object: T) => {
        if (!objectData.extensions) {
          return;
        }
        if (!gltfData) {
          console.log("Gltf data was not loaded before postParse, skipping postParse extensions for", objectData);
          return;
        }

        registry.postParse(object, objectData.extensions, gltfData);
      }
    }

    function createModel(name: any, meshGroup: any, materials: any, defaultMaterial: any) {
      console.log(name, meshGroup, materials, defaultMaterial);
    };

    return {
      global: {
        preprocess: (gltf: GltfData) => (gltfData = gltf)
      },
      node: {
        process: createNode,
        postprocess: createPostProcessHandler(this._node)
      },
      scene: { postprocess: createPostProcessHandler(this._scene) },
      camera: { postprocess: createPostProcessHandler(this._camera) },
      texture: {
        postprocess: (objectData: ObjectData, object: TextureAsset) => {
          if (!objectData.extensions) {
            return;
          }
          this._texture.postParse(object.resource, objectData.extensions);
        },
      },
      material: { postprocess: createPostProcessHandler(this._material) }
    };
  }


  public removeAll() {
    this._node.removeAll();
    this._scene.removeAll();
    this._camera.removeAll();
    this._texture.removeAll();
    this._material.removeAll();
  }
};


// function globalPostProcess(gltf: GltfData, result: any) {
//   var disableFlipV = gltf.asset && gltf.asset.generator === 'PlayCanvas';
//   for (let i = 0; i < result.renders.length; ++i) {
//     const a = result.renders[i];
//     // for (let j = 0; j < result.renders[i].meshes.length; ++j)
//     // {
//     //   const mesh = result.renders[i].meshes[j];
//     // }
//   }
// }


function createNode(gltfNode: any, nodeIndex: number): pc.Entity {
  const entity = new pc.Entity();
  const tempMat = new pc.Mat4();
  const tempVec = new pc.Vec3();
  if (gltfNode.hasOwnProperty('name') && gltfNode.name.length > 0) {
    entity.name = gltfNode.name.replace(/\//g, '_');
  } else {
    entity.name = 'node_' + nodeIndex;
  }
  if (gltfNode.hasOwnProperty('matrix')) {
    tempMat.data.set(gltfNode.matrix);
    tempMat.getTranslation(tempVec);
    entity.setLocalPosition(tempVec);
    tempMat.getEulerAngles(tempVec);
    entity.setLocalEulerAngles(tempVec);
    tempMat.getScale(tempVec);
    entity.setLocalScale(tempVec);
  }
  if (gltfNode.hasOwnProperty('rotation')) {
    var r = gltfNode.rotation;
    entity.setLocalRotation(r[0], r[1], r[2], r[3]);
  }
  if (gltfNode.hasOwnProperty('translation')) {
    var t = gltfNode.translation;
    entity.setLocalPosition(t[0], t[1], t[2]);
  }
  if (gltfNode.hasOwnProperty('scale')) {
    var s = gltfNode.scale;
    entity.setLocalScale(s[0], s[1], s[2]);
  }
  return entity;
};