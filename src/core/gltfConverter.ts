
import * as pc from "playcanvas";

var tempMat = new pc.Mat4();
var tempVec = new pc.Vec3();

function createNode(gltfNode: any, nodeIndex: number): pc.Entity {
  var entity = new pc.Entity();
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
}
export function createNodes(gltf: any, options: any): pc.Entity[] {
  if (!gltf.hasOwnProperty('nodes') || gltf.nodes.length === 0) {
    return [];
  }
  var preprocess = options && options.node && options.node.preprocess;
  var process = options && options.node && options.node.process || createNode;
  var postprocess = options && options.node && options.node.postprocess;
  var nodes = gltf.nodes.map(function (gltfNode: any, index: number) {
    if (preprocess) {
      preprocess(gltfNode);
    }
    var node = process(gltfNode, index);
    if (postprocess) {
      postprocess(gltfNode, node);
    }
    return node;
  });
  for (var i = 0; i < gltf.nodes.length; ++i) {
    var gltfNode = gltf.nodes[i];
    if (gltfNode.hasOwnProperty('children')) {
      for (var j = 0; j < gltfNode.children.length; ++j) {
        var parent = nodes[i];
        var child = nodes[gltfNode.children[j]];
        if (!child.parent) {
          parent.addChild(child);
        }
      }
    }
  }
  return nodes;
}

function createScene(sceneData: any, sceneIndex: number, nodes: pc.Entity[]) {
  var sceneRoot = new pc.Entity();
  if (sceneData.hasOwnProperty('name')) {
    sceneRoot.name = sceneData.name;
  } else {
    sceneRoot.name = 'scene_' + sceneIndex;
  }

  sceneData.nodes.forEach(function (nodeIndex: number) {
    var node = nodes[nodeIndex];
    if (node !== undefined) {
      sceneRoot.addChild(node);
    }
  });

  return sceneRoot;
}

export function createScenes(gltf: any, nodes: pc.Entity[], options: any): pc.Entity[] {
  if (!gltf.hasOwnProperty('scenes') || gltf.scenes.length === 0) {
    return [];
  }
  var preprocess = options && options.scene && options.scene.preprocess;
  var process = options && options.scene && options.scene.process || createScene;
  var postprocess = options && options.scene && options.scene.postprocess;
  return gltf.scenes.map(function (gltfScene: any, index: number) {
    if (preprocess) {
      preprocess(gltfScene);
    }
    var scene = process(gltfScene, index, nodes);
    if (postprocess) {
      postprocess(gltfScene, scene);
    }
    return scene;
  });
}

function createCamera(gltfCamera: any, node: pc.Entity): pc.CameraComponent {
  var cameraProps: any = {
    enabled: false
  };
  if (gltfCamera.type === "orthographic") {
    var orthographic = gltfCamera.orthographic;
    var xMag = orthographic.xmag;
    var yMag = orthographic.ymag;
    var orthographicAR = xMag !== undefined ? xMag / yMag : undefined;
    cameraProps.projection = pc.PROJECTION_ORTHOGRAPHIC;
    cameraProps.aspectRatioMode = orthographicAR !== undefined ? pc.ASPECT_MANUAL : pc.ASPECT_AUTO;
    cameraProps.aspectRatio = orthographicAR;
    cameraProps.orthoHeight = yMag;
    cameraProps.farClip = orthographic.zfar;
    cameraProps.nearClip = orthographic.znear;
  } else {
    var perspective = gltfCamera.perspective;
    var perspectiveAR = perspective.aspectRatio;
    cameraProps.projection = pc.PROJECTION_PERSPECTIVE;
    cameraProps.aspectRatioMode = perspectiveAR !== undefined ? pc.ASPECT_MANUAL : pc.ASPECT_AUTO;
    cameraProps.aspectRatio = perspectiveAR;
    cameraProps.fov = perspective.yfov * pc.math.RAD_TO_DEG;
    cameraProps.farClip = perspective.zfar;
    cameraProps.nearClip = perspective.znear;
  }
  return node.addComponent("camera", cameraProps) as pc.CameraComponent;
}

export function createCameras(gltf: any, nodes: pc.Entity[], options: any): pc.CameraComponent[] {
  if (!gltf.hasOwnProperty('nodes') || !gltf.hasOwnProperty('cameras') || gltf.cameras.length === 0) {
    return [];
  }
  var preprocess = options && options.camera && options.camera.preprocess;
  var process = options && options.camera && options.camera.process || createCamera;
  var postprocess = options && options.camera && options.camera.postprocess;
  var cameras: pc.CameraComponent[] = [];
  gltf.nodes.forEach(function (gltfNode: any, nodeIndex: number) {
    if (!gltfNode.hasOwnProperty('camera')) {
      return;
    }
    var gltfCamera = gltf.cameras[gltfNode.camera];
    if (!gltfCamera) {
      return;
    }
    if (preprocess) {
      preprocess(gltfCamera);
    }
    var camera = process(gltfCamera, nodes[nodeIndex]);
    if (postprocess) {
      postprocess(gltfCamera, camera);
    }
    cameras.push(camera);
  });
  return cameras;
}

function createLight(gltfLight: any, node: pc.Entity): pc.LightComponent {
  var lightProps: any = {
    type: gltfLight.type,
    falloffMode: pc.LIGHTFALLOFF_INVERSESQUARED
  };
  if (gltfLight.hasOwnProperty('color')) {
    lightProps.color = new pc.Color(gltfLight.color);
  }
  if (gltfLight.hasOwnProperty('intensity')) {
    lightProps.intensity = gltfLight.intensity;
  } else {
    lightProps.intensity = 1;
  }
  if (gltfLight.hasOwnProperty('range')) {
    lightProps.range = gltfLight.range;
  } else {
    lightProps.range = Number.POSITIVE_INFINITY;
  }
  if (gltfLight.hasOwnProperty('spot') && gltfLight.spot.hasOwnProperty('innerConeAngle')) {
    lightProps.innerConeAngle = gltfLight.spot.innerConeAngle * pc.math.RAD_TO_DEG;
  } else {
    lightProps.innerConeAngle = 0;
  }
  if (gltfLight.hasOwnProperty('spot') && gltfLight.spot.hasOwnProperty('outerConeAngle')) {
    lightProps.outerConeAngle = gltfLight.spot.outerConeAngle * pc.math.RAD_TO_DEG;
  }
  var lightNode = new pc.Entity(node.name);
  lightNode.rotateLocal(90, 0, 0);
  node.addChild(lightNode);
  return lightNode.addComponent("light", lightProps) as pc.LightComponent;
};

export function createLights(gltf: any, nodes: pc.Entity[], options: any): pc.LightComponent[] {
  if (!gltf.hasOwnProperty('nodes') ||
    !gltf.hasOwnProperty('extensions') ||
    !gltf.extensions.hasOwnProperty('KHR_lights_punctual') ||
    !gltf.extensions.KHR_lights_punctual.hasOwnProperty('lights')) {
    return [];
  }
  var gltfLights = gltf.extensions.KHR_lights_punctual.lights;
  if (gltfLights.length === 0) {
    return [];
  }
  var preprocess = options && options.light && options.light.preprocess;
  var process = options && options.light && options.light.process || createLight;
  var postprocess = options && options.light && options.light.postprocess;
  var lights: pc.LightComponent[] = [];
  gltf.nodes.forEach(function (gltfNode: any, nodeIndex: number) {
    if (!gltfNode.hasOwnProperty('extensions') ||
      !gltfNode.extensions.hasOwnProperty('KHR_lights_punctual') ||
      !gltfNode.extensions.KHR_lights_punctual.hasOwnProperty('light')) {
      return;
    }
    var lightIndex = gltfNode.extensions.KHR_lights_punctual.light;
    var gltfLight = gltfLights[lightIndex];
    if (!gltfLight) {
      return;
    }
    if (preprocess) {
      preprocess(gltfLight);
    }
    var light = process(gltfLight, nodes[nodeIndex]);
    if (postprocess) {
      postprocess(gltfLight, light);
    }
    lights.push(light);
  });
  return lights;
}

var createMaterial = function (gltfMaterial: any, textures: pc.Texture[], disableFlipV: boolean): pc.StandardMaterial {
  var glossChunk = ["#ifdef MAPFLOAT", "uniform float material_shininess;", "#endif", "", "#ifdef MAPTEXTURE", "uniform sampler2D texture_glossMap;", "#endif", "", "void getGlossiness() {", "		dGlossiness = 1.0;", "", "#ifdef MAPFLOAT", "		dGlossiness *= material_shininess;", "#endif", "", "#ifdef MAPTEXTURE", "		dGlossiness *= texture2D(texture_glossMap, $UV).$CH;", "#endif", "", "#ifdef MAPVERTEX", "		dGlossiness *= saturate(vVertexColor.$VC);", "#endif", "", "		dGlossiness = 1.0 - dGlossiness;", "", "		dGlossiness += 0.0000001;", "}"].join('\n');
  var specularChunk = ["#ifdef MAPCOLOR", "uniform vec3 material_specular;", "#endif", "", "#ifdef MAPTEXTURE", "uniform sampler2D texture_specularMap;", "#endif", "", "void getSpecularity() {", "		dSpecularity = vec3(1.0);", "", "		#ifdef MAPCOLOR", "				dSpecularity *= material_specular;", "		#endif", "", "		#ifdef MAPTEXTURE", "				vec3 srgb = texture2D(texture_specularMap, $UV).$CH;", "				dSpecularity *= vec3(pow(srgb.r, 2.2), pow(srgb.g, 2.2), pow(srgb.b, 2.2));", "		#endif", "", "		#ifdef MAPVERTEX", "				dSpecularity *= saturate(vVertexColor.$VC);", "		#endif", "}"].join('\n');
  var clearCoatGlossChunk = ["#ifdef MAPFLOAT", "uniform float material_clearCoatGlossiness;", "#endif", "", "#ifdef MAPTEXTURE", "uniform sampler2D texture_clearCoatGlossMap;", "#endif", "", "void getClearCoatGlossiness() {", "		ccGlossiness = 1.0;", "", "#ifdef MAPFLOAT", "		ccGlossiness *= material_clearCoatGlossiness;", "#endif", "", "#ifdef MAPTEXTURE", "		ccGlossiness *= texture2D(texture_clearCoatGlossMap, $UV).$CH;", "#endif", "", "#ifdef MAPVERTEX", "		ccGlossiness *= saturate(vVertexColor.$VC);", "#endif", "", "		ccGlossiness = 1.0 - ccGlossiness;", "", "		ccGlossiness += 0.0000001;", "}"].join('\n');
  var zeros = [0, 0];
  var ones = [1, 1];

  var extractTextureTransform = function extractTextureTransform(source: any, material: any, maps: any) {
    var _source$extensions;

    var map;
    var texCoord = source.texCoord;

    if (texCoord) {
      for (map = 0; map < maps.length; ++map) {
        material[maps[map] + 'MapUv'] = texCoord;
      }
    }

    var textureTransform = (_source$extensions = source.extensions) == null ? void 0 : _source$extensions.KHR_texture_transform;

    if (textureTransform) {
      var offset = textureTransform.offset || zeros;
      var scale = textureTransform.scale || ones;
      var rotation = textureTransform.rotation ? -textureTransform.rotation * pc.math.RAD_TO_DEG : 0;
      var tilingVec = new pc.Vec2(scale[0], scale[1]);
      var offsetVec = new pc.Vec2(offset[0], 1.0 - scale[1] - offset[1]);

      for (map = 0; map < maps.length; ++map) {
        material[maps[map] + "MapTiling"] = tilingVec;
        material[maps[map] + "MapOffset"] = offsetVec;
        material[maps[map] + "MapRotation"] = rotation;
      }
    }
  };

  var material = new pc.StandardMaterial();
  material.occludeSpecular = pc.SPECOCC_NONE;
  material.diffuseTint = true;
  material.diffuseVertexColor = true;
  material.specularTint = true;
  material.specularVertexColor = true;

  if (gltfMaterial.hasOwnProperty('name')) {
    material.name = gltfMaterial.name;
  }

  var color;
  var texture: any;

  if (gltfMaterial.hasOwnProperty('extensions') && gltfMaterial.extensions.hasOwnProperty('KHR_materials_pbrSpecularGlossiness')) {
    var specData = gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness;

    if (specData.hasOwnProperty('diffuseFactor')) {
      color = specData.diffuseFactor;
      material.diffuse.set(Math.pow(color[0], 1 / 2.2), Math.pow(color[1], 1 / 2.2), Math.pow(color[2], 1 / 2.2));
      material.opacity = color[3];
    } else {
      material.diffuse.set(1, 1, 1);
      material.opacity = 1;
    }

    if (specData.hasOwnProperty('diffuseTexture')) {
      var diffuseTexture = specData.diffuseTexture;
      texture = textures[diffuseTexture.index];
      material.diffuseMap = texture as pc.Texture;
      material.diffuseMapChannel = 'rgb';
      material.opacityMap = texture;
      material.opacityMapChannel = 'a';
      extractTextureTransform(diffuseTexture, material, ['diffuse', 'opacity']);
    }

    material.useMetalness = false;

    if (specData.hasOwnProperty('specularFactor')) {
      color = specData.specularFactor;
      material.specular.set(Math.pow(color[0], 1 / 2.2), Math.pow(color[1], 1 / 2.2), Math.pow(color[2], 1 / 2.2));
    } else {
      material.specular.set(1, 1, 1);
    }

    if (specData.hasOwnProperty('glossinessFactor')) {
      material.shininess = 100 * specData.glossinessFactor;
    } else {
      material.shininess = 100;
    }

    if (specData.hasOwnProperty('specularGlossinessTexture')) {
      var specularGlossinessTexture = specData.specularGlossinessTexture;
      material.specularMap = material.glossMap = textures[specularGlossinessTexture.index] as any;
      material.specularMapChannel = 'rgb';
      material.glossMapChannel = 'a';
      extractTextureTransform(specularGlossinessTexture, material, ['gloss', 'metalness']);
    }

    material.chunks.specularPS = specularChunk;
  } else if (gltfMaterial.hasOwnProperty('pbrMetallicRoughness')) {
    var pbrData = gltfMaterial.pbrMetallicRoughness;

    if (pbrData.hasOwnProperty('baseColorFactor')) {
      color = pbrData.baseColorFactor;
      material.diffuse.set(Math.pow(color[0], 1 / 2.2), Math.pow(color[1], 1 / 2.2), Math.pow(color[2], 1 / 2.2));
      material.opacity = color[3];
    } else {
      material.diffuse.set(1, 1, 1);
      material.opacity = 1;
    }

    if (pbrData.hasOwnProperty('baseColorTexture')) {
      var baseColorTexture = pbrData.baseColorTexture;
      texture = textures[baseColorTexture.index];
      material.diffuseMap = texture;
      material.diffuseMapChannel = 'rgb';
      material.opacityMap = texture;
      material.opacityMapChannel = 'a';
      extractTextureTransform(baseColorTexture, material, ['diffuse', 'opacity']);
    }

    material.useMetalness = true;

    if (pbrData.hasOwnProperty('metallicFactor')) {
      material.metalness = pbrData.metallicFactor;
    } else {
      material.metalness = 1;
    }

    if (pbrData.hasOwnProperty('roughnessFactor')) {
      material.shininess = 100 * pbrData.roughnessFactor;
    } else {
      material.shininess = 100;
    }

    if (pbrData.hasOwnProperty('metallicRoughnessTexture')) {
      var metallicRoughnessTexture = pbrData.metallicRoughnessTexture;
      material.metalnessMap = material.glossMap = textures[metallicRoughnessTexture.index] as any;
      material.metalnessMapChannel = 'b';
      material.glossMapChannel = 'g';
      extractTextureTransform(metallicRoughnessTexture, material, ['gloss', 'metalness']);
    }

    material.chunks.glossPS = glossChunk;
  }

  if (gltfMaterial.hasOwnProperty('normalTexture')) {
    var normalTexture = gltfMaterial.normalTexture;
    material.normalMap = textures[normalTexture.index] as any;
    extractTextureTransform(normalTexture, material, ['normal']);

    if (normalTexture.hasOwnProperty('scale')) {
      material.bumpiness = normalTexture.scale;
    }
  }

  if (gltfMaterial.hasOwnProperty('occlusionTexture')) {
    var occlusionTexture = gltfMaterial.occlusionTexture;
    material.aoMap = textures[occlusionTexture.index] as any;
    material.aoMapChannel = 'r';
    extractTextureTransform(occlusionTexture, material, ['ao']);
  }

  if (gltfMaterial.hasOwnProperty('emissiveFactor')) {
    color = gltfMaterial.emissiveFactor;
    material.emissive.set(Math.pow(color[0], 1 / 2.2), Math.pow(color[1], 1 / 2.2), Math.pow(color[2], 1 / 2.2));
    material.emissiveTint = true;
  } else {
    material.emissive.set(0, 0, 0);
    material.emissiveTint = false;
  }

  if (gltfMaterial.hasOwnProperty('emissiveTexture')) {
    var emissiveTexture = gltfMaterial.emissiveTexture;
    material.emissiveMap = textures[emissiveTexture.index] as any;
    extractTextureTransform(emissiveTexture, material, ['emissive']);
  }

  if (gltfMaterial.hasOwnProperty('alphaMode')) {
    switch (gltfMaterial.alphaMode) {
      case 'MASK':
        material.blendType = pc.BLEND_NONE;

        if (gltfMaterial.hasOwnProperty('alphaCutoff')) {
          material.alphaTest = gltfMaterial.alphaCutoff;
        } else {
          material.alphaTest = 0.5;
        }

        break;

      case 'BLEND':
        material.blendType = pc.BLEND_NORMAL;
        break;

      default:
      case 'OPAQUE':
        material.blendType = pc.BLEND_NONE;
        break;
    }
  } else {
    material.blendType = pc.BLEND_NONE;
  }

  if (gltfMaterial.hasOwnProperty('doubleSided')) {
    material.twoSidedLighting = gltfMaterial.doubleSided;
    material.cull = gltfMaterial.doubleSided ? pc.CULLFACE_NONE : pc.CULLFACE_BACK;
  } else {
    material.twoSidedLighting = false;
    material.cull = pc.CULLFACE_BACK;
  }

  if (gltfMaterial.hasOwnProperty('extensions') && gltfMaterial.extensions.hasOwnProperty('KHR_materials_clearcoat')) {
    var ccData = gltfMaterial.extensions.KHR_materials_clearcoat;

    if (ccData.hasOwnProperty('clearcoatFactor')) {
      material.clearCoat = ccData.clearcoatFactor * 0.25;
    } else {
      material.clearCoat = 0;
    }

    if (ccData.hasOwnProperty('clearcoatTexture')) {
      var clearcoatTexture = ccData.clearcoatTexture;
      material.clearCoatMap = textures[clearcoatTexture.index] as any;
      material.clearCoatMapChannel = 'r';
      extractTextureTransform(clearcoatTexture, material, ['clearCoat']);
    }

    if (ccData.hasOwnProperty('clearcoatRoughnessFactor')) {
      material.clearCoatGlossiness = ccData.clearcoatRoughnessFactor;
    } else {
      material.clearCoatGlossiness = 0;
    }

    if (ccData.hasOwnProperty('clearcoatRoughnessTexture')) {
      var clearcoatRoughnessTexture = ccData.clearcoatRoughnessTexture;
      material.clearCoatGlossMap = textures[clearcoatRoughnessTexture.index] as any;
      material.clearCoatGlossMapChannel = 'g';
      extractTextureTransform(clearcoatRoughnessTexture, material, ['clearCoatGloss']);
    }

    if (ccData.hasOwnProperty('clearcoatNormalTexture')) {
      var clearcoatNormalTexture = ccData.clearcoatNormalTexture;
      material.clearCoatNormalMap = textures[clearcoatNormalTexture.index] as any;
      extractTextureTransform(clearcoatNormalTexture, material, ['clearCoatNormal']);

      if (clearcoatNormalTexture.hasOwnProperty('scale')) {
        material.clearCoatBumpiness = clearcoatNormalTexture.scale;
      }
    }

    material.chunks.clearCoatGlossPS = clearCoatGlossChunk;
  }

  if (gltfMaterial.hasOwnProperty('extensions') && gltfMaterial.extensions.hasOwnProperty('KHR_materials_unlit')) {
    material.useLighting = false;
    material.emissive.copy(material.diffuse);
    material.emissiveTint = material.diffuseTint;
    material.emissiveMap = material.diffuseMap;
    material.emissiveMapUv = material.diffuseMapUv;
    material.emissiveMapTiling.copy(material.diffuseMapTiling);
    material.emissiveMapOffset.copy(material.diffuseMapOffset);
    material.emissiveMapChannel = material.diffuseMapChannel;
    material.emissiveVertexColor = material.diffuseVertexColor;
    material.emissiveVertexColorChannel = material.diffuseVertexColorChannel;
    material.diffuse.set(0, 0, 0);
    material.diffuseTint = false;
    material.diffuseMap = null;
    material.diffuseVertexColor = false;
  }

  material.update();
  return material;
};

export function createMaterials(gltf: any, textures: pc.Texture[], options: any, disableFlipV: boolean): pc.StandardMaterial[] {
  if (!gltf.hasOwnProperty('materials') || gltf.materials.length === 0) {
    return [];
  }
  var preprocess = options && options.material && options.material.preprocess;
  var process = options && options.material && options.material.process || createMaterial;
  var postprocess = options && options.material && options.material.postprocess;
  return gltf.materials.map(function (gltfMaterial: any): pc.StandardMaterial {
    if (preprocess) {
      preprocess(gltfMaterial);
    }
    var material = process(gltfMaterial, textures, disableFlipV);
    if (postprocess) {
      postprocess(gltfMaterial, material);
    }
    return material;
  });
};

function getNumComponents(accessorType: string) {
  switch (accessorType) {
    case 'SCALAR': return 1;
    case 'VEC2': return 2;
    case 'VEC3': return 3;
    case 'VEC4': return 4;
    case 'MAT2': return 4;
    case 'MAT3': return 9;
    case 'MAT4': return 16;
    default: return 3;
  }
};

function getComponentDataType(componentType: number) {
  switch (componentType) {
    case 5120: return Int8Array;
    case 5121: return Uint8Array;
    case 5122: return Int16Array;
    case 5123: return Uint16Array;
    case 5124: return Int32Array;
    case 5125: return Uint32Array;
    case 5126: return Float32Array;
    default: return null;
  }
};

function getAccessorData(gltfAccessor: any, bufferViews: any, flatten: boolean = false): any {
  const numComponents = getNumComponents(gltfAccessor.type);
  const dataType = getComponentDataType(gltfAccessor.componentType);
  if (!dataType) {
    return null;
  }

  const bufferView = bufferViews[gltfAccessor.bufferView];
  let result;

  if (gltfAccessor.sparse) {
    // handle sparse data
    const sparse = gltfAccessor.sparse;

    // get indices data
    const indicesAccessor = {
      count: sparse.count,
      type: "SCALAR"
    };
    const indices = getAccessorData(Object.assign(indicesAccessor, sparse.indices), bufferViews, true);

    // data values data
    const valuesAccessor = {
      count: sparse.count,
      type: gltfAccessor.scalar,
      componentType: gltfAccessor.componentType
    };
    const values = getAccessorData(Object.assign(valuesAccessor, sparse.values), bufferViews, true);

    // get base data
    if (gltfAccessor.hasOwnProperty('bufferView')) {
      const baseAccessor = {
        bufferView: gltfAccessor.bufferView,
        byteOffset: gltfAccessor.byteOffset,
        componentType: gltfAccessor.componentType,
        count: gltfAccessor.count,
        type: gltfAccessor.type
      };
      // make a copy of the base data since we'll patch the values
      result = getAccessorData(baseAccessor, bufferViews, true).slice();
    } else {
      // there is no base data, create empty 0'd out data
      result = new dataType(gltfAccessor.count * numComponents);
    }

    for (let i = 0; i < sparse.count; ++i) {
      const targetIndex = indices[i];
      for (let j = 0; j < numComponents; ++j) {
        result[targetIndex * numComponents + j] = values[i * numComponents + j];
      }
    }
  } else if (flatten && bufferView.hasOwnProperty('byteStride')) {
    // flatten stridden data
    const bytesPerElement = numComponents * dataType.BYTES_PER_ELEMENT;
    const storage = new ArrayBuffer(gltfAccessor.count * bytesPerElement);
    const tmpArray = new Uint8Array(storage);

    let dstOffset = 0;
    for (let i = 0; i < gltfAccessor.count; ++i) {
      // no need to add bufferView.byteOffset because accessor takes this into account
      let srcOffset = (gltfAccessor.byteOffset || 0) + i * bufferView.byteStride;
      for (let b = 0; b < bytesPerElement; ++b) {
        tmpArray[dstOffset++] = bufferView[srcOffset++];
      }
    }

    result = new dataType(storage);
  } else {
    result = new dataType(bufferView.buffer,
      bufferView.byteOffset + (gltfAccessor.byteOffset || 0),
      gltfAccessor.count * numComponents);
  }

  return result;
};

const gltfToEngineSemanticMap: any[string] = {
  'POSITION': pc.SEMANTIC_POSITION,
  'NORMAL': pc.SEMANTIC_NORMAL,
  'TANGENT': pc.SEMANTIC_TANGENT,
  'COLOR_0': pc.SEMANTIC_COLOR,
  'JOINTS_0': pc.SEMANTIC_BLENDINDICES,
  'WEIGHTS_0': pc.SEMANTIC_BLENDWEIGHT,
  'TEXCOORD_0': pc.SEMANTIC_TEXCOORD0,
  'TEXCOORD_1': pc.SEMANTIC_TEXCOORD1,
  'TEXCOORD_2': pc.SEMANTIC_TEXCOORD2,
  'TEXCOORD_3': pc.SEMANTIC_TEXCOORD3,
  'TEXCOORD_4': pc.SEMANTIC_TEXCOORD4,
  'TEXCOORD_5': pc.SEMANTIC_TEXCOORD5,
  'TEXCOORD_6': pc.SEMANTIC_TEXCOORD6,
  'TEXCOORD_7': pc.SEMANTIC_TEXCOORD7
};

function getComponentSizeInBytes(componentType: number): number {
  switch (componentType) {
    case 5120: return 1;    // int8
    case 5121: return 1;    // uint8
    case 5122: return 2;    // int16
    case 5123: return 2;    // uint16
    case 5124: return 4;    // int32
    case 5125: return 4;    // uint32
    case 5126: return 4;    // float32
    default: return 0;
  }
};

function getComponentType(componentType: number) {
  switch (componentType) {
    case 5120: return pc.TYPE_INT8;
    case 5121: return pc.TYPE_UINT8;
    case 5122: return pc.TYPE_INT16;
    case 5123: return pc.TYPE_UINT16;
    case 5124: return pc.TYPE_INT32;
    case 5125: return pc.TYPE_UINT32;
    case 5126: return pc.TYPE_FLOAT32;
    default: return 0;
  }
};

const typedArrayTypes = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array];
export const typedArrayTypesByteSize = [1, 1, 2, 2, 4, 4, 4];
const generateIndices = function (numVertices: number) {
  const dummyIndices = new Uint16Array(numVertices);
  for (let i = 0; i < numVertices; i++) {
    dummyIndices[i] = i;
  }
  return dummyIndices;
};
function calculateNormals(positions: any, indices: any) {
  const triangleCount = indices.length / 3;
  const vertexCount = positions.length / 3;
  const p1 = new pc.Vec3();
  const p2 = new pc.Vec3();
  const p3 = new pc.Vec3();
  const p1p2 = new pc.Vec3();
  const p1p3 = new pc.Vec3();
  const faceNormal = new pc.Vec3();

  const normals = [];

  // Initialize the normal array to zero
  for (let i = 0; i < positions.length; i++) {
    normals[i] = 0;
  }

  // Accumulate face normals for each vertex
  for (let i = 0; i < triangleCount; i++) {
    const i1 = indices[i * 3];
    const i2 = indices[i * 3 + 1];
    const i3 = indices[i * 3 + 2];

    p1.set(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
    p2.set(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
    p3.set(positions[i3 * 3], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);

    p1p2.sub2(p2, p1);
    p1p3.sub2(p3, p1);
    faceNormal.cross(p1p2, p1p3).normalize();

    normals[i1 * 3] += faceNormal.x;
    normals[i1 * 3 + 1] += faceNormal.y;
    normals[i1 * 3 + 2] += faceNormal.z;
    normals[i2 * 3] += faceNormal.x;
    normals[i2 * 3 + 1] += faceNormal.y;
    normals[i2 * 3 + 2] += faceNormal.z;
    normals[i3 * 3] += faceNormal.x;
    normals[i3 * 3 + 1] += faceNormal.y;
    normals[i3 * 3 + 2] += faceNormal.z;
  }

  // Normalize all normals
  for (let i = 0; i < vertexCount; i++) {
    const nx = normals[i * 3];
    const ny = normals[i * 3 + 1];
    const nz = normals[i * 3 + 2];
    const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
    normals[i * 3] *= invLen;
    normals[i * 3 + 1] *= invLen;
    normals[i * 3 + 2] *= invLen;
  }

  return normals;
}
function generateNormals(sourceDesc: any, indices: any) {
  // get positions
  const p = sourceDesc[pc.SEMANTIC_POSITION];
  if (!p || p.components !== 3) {
    return;
  }

  let positions;
  if (p.size !== p.stride) {
    // extract positions which aren't tightly packed
    const srcStride = p.stride / typedArrayTypesByteSize[p.type];
    const src = new typedArrayTypes[p.type](p.buffer, p.offset, p.count * srcStride);
    positions = new typedArrayTypes[p.type](p.count * 3);
    for (let i = 0; i < p.count; ++i) {
      positions[i * 3 + 0] = src[i * srcStride + 0];
      positions[i * 3 + 1] = src[i * srcStride + 1];
      positions[i * 3 + 2] = src[i * srcStride + 2];
    }
  } else {
    // position data is tightly packed so we can use it directly
    positions = new typedArrayTypes[p.type](p.buffer, p.offset, p.count * 3);
  }

  const numVertices = p.count;

  // generate indices if necessary
  if (!indices) {
    indices = generateIndices(numVertices);
  }

  // generate normals
  const normalsTemp = calculateNormals(positions, indices);
  const normals = new Float32Array(normalsTemp.length);
  normals.set(normalsTemp);

  sourceDesc[pc.SEMANTIC_NORMAL] = {
    buffer: normals.buffer,
    size: 12,
    offset: 0,
    stride: 12,
    count: numVertices,
    components: 3,
    type: pc.TYPE_FLOAT32
  };
};

function flipTexCoordVs(vertexBuffer: any) {
  let i, j;

  const floatOffsets = [];
  const shortOffsets = [];
  const byteOffsets = [];
  for (i = 0; i < vertexBuffer.format.elements.length; ++i) {
    const element = vertexBuffer.format.elements[i];
    if (element.name === pc.SEMANTIC_TEXCOORD0 ||
      element.name === pc.SEMANTIC_TEXCOORD1) {
      switch (element.dataType) {
        case pc.TYPE_FLOAT32:
          floatOffsets.push({ offset: element.offset / 4 + 1, stride: element.stride / 4 });
          break;
        case pc.TYPE_UINT16:
          shortOffsets.push({ offset: element.offset / 2 + 1, stride: element.stride / 2 });
          break;
        case pc.TYPE_UINT8:
          byteOffsets.push({ offset: element.offset + 1, stride: element.stride });
          break;
      }
    }
  }

  const flip = function (offsets: any, type: any, one: any) {
    const typedArray = new type(vertexBuffer.storage);
    for (i = 0; i < offsets.length; ++i) {
      let index = offsets[i].offset;
      const stride = offsets[i].stride;
      for (j = 0; j < vertexBuffer.numVertices; ++j) {
        typedArray[index] = one - typedArray[index];
        index += stride;
      }
    }
  };

  if (floatOffsets.length > 0) {
    flip(floatOffsets, Float32Array, 1.0);
  }
  if (shortOffsets.length > 0) {
    flip(shortOffsets, Uint16Array, 65535);
  }
  if (byteOffsets.length > 0) {
    flip(byteOffsets, Uint8Array, 255);
  }
};

function createVertexBufferInternal(device: any, sourceDesc: any, flipV: any) {
  const positionDesc = sourceDesc[pc.SEMANTIC_POSITION];
  if (!positionDesc) {
    // ignore meshes without positions
    return null;
  }
  const numVertices = positionDesc.count;

  // generate vertexDesc elements
  const vertexDesc = [];
  for (const semantic in sourceDesc) {
    if (sourceDesc.hasOwnProperty(semantic)) {
      vertexDesc.push({
        semantic: semantic,
        components: sourceDesc[semantic].components,
        type: sourceDesc[semantic].type,
        normalize: !!sourceDesc[semantic].normalize
      });
    }
  }

  // order vertexDesc to match the rest of the engine
  const elementOrder = [
    pc.SEMANTIC_POSITION,
    pc.SEMANTIC_NORMAL,
    pc.SEMANTIC_TANGENT,
    pc.SEMANTIC_COLOR,
    pc.SEMANTIC_BLENDINDICES,
    pc.SEMANTIC_BLENDWEIGHT,
    pc.SEMANTIC_TEXCOORD0,
    pc.SEMANTIC_TEXCOORD1
  ];

  // sort vertex elements by engine-ideal order
  vertexDesc.sort(function (lhs, rhs) {
    const lhsOrder = elementOrder.indexOf(lhs.semantic);
    const rhsOrder = elementOrder.indexOf(rhs.semantic);
    return (lhsOrder < rhsOrder) ? -1 : (rhsOrder < lhsOrder ? 1 : 0);
  });

  let i, j, k;
  let source, target, sourceOffset;

  const vertexFormat = new pc.VertexFormat(device, vertexDesc);

  // check whether source data is correctly interleaved
  let isCorrectlyInterleaved = true;
  for (i = 0; i < vertexFormat.elements.length; ++i) {
    target = vertexFormat.elements[i];
    source = sourceDesc[target.name];
    sourceOffset = source.offset - positionDesc.offset;
    if ((source.buffer !== positionDesc.buffer) ||
      (source.stride !== target.stride) ||
      (source.size !== target.size) ||
      (sourceOffset !== target.offset)) {
      isCorrectlyInterleaved = false;
      break;
    }
  }

  // create vertex buffer
  const vertexBuffer = new pc.VertexBuffer(device,
    vertexFormat,
    numVertices,
    pc.BUFFER_STATIC) as any;

  const vertexData = vertexBuffer.lock();
  const targetArray = new Uint32Array(vertexData);
  let sourceArray;

  if (isCorrectlyInterleaved) {
    // copy data
    sourceArray = new Uint32Array(positionDesc.buffer,
      positionDesc.offset,
      numVertices * vertexBuffer.format.size / 4);
    targetArray.set(sourceArray);
  } else {
    let targetStride, sourceStride;
    // copy data and interleave
    for (i = 0; i < vertexBuffer.format.elements.length; ++i) {
      target = vertexBuffer.format.elements[i];
      targetStride = target.stride / 4;

      source = sourceDesc[target.name];
      sourceStride = source.stride / 4;
      // ensure we don't go beyond the end of the arraybuffer when dealing with
      // interlaced vertex formats
      sourceArray = new Uint32Array(source.buffer, source.offset, (source.count - 1) * sourceStride + (source.size + 3) / 4);

      let src = 0;
      let dst = target.offset / 4;
      const kend = Math.floor((source.size + 3) / 4);
      for (j = 0; j < numVertices; ++j) {
        for (k = 0; k < kend; ++k) {
          targetArray[dst + k] = sourceArray[src + k];
        }
        src += sourceStride;
        dst += targetStride;
      }
    }
  }

  if (flipV) {
    flipTexCoordVs(vertexBuffer);
  }

  vertexBuffer.unlock();

  return vertexBuffer;
};

function createVertexBuffer(device: any, attributes: any, indices: any, accessors: any, bufferViews: any, flipV: any, vertexBufferDict: any) {

  // extract list of attributes to use
  const useAttributes: any = {};
  const attribIds = [];

  for (const attrib in attributes) {
    if (attributes.hasOwnProperty(attrib) && gltfToEngineSemanticMap.hasOwnProperty(attrib)) {
      useAttributes[attrib] = attributes[attrib];

      // build unique id for each attribute in format: Semantic:accessorIndex
      attribIds.push(attrib + ":" + attributes[attrib]);
    }
  }

  // sort unique ids and create unique vertex buffer ID
  attribIds.sort();
  const vbKey = attribIds.join();

  // return already created vertex buffer if identical
  let vb = vertexBufferDict[vbKey];
  if (!vb) {
    // build vertex buffer format desc and source
    const sourceDesc: any = {};
    for (const attrib in useAttributes) {
      const accessor = accessors[attributes[attrib]];
      const accessorData = getAccessorData(accessor, bufferViews);
      const bufferView = bufferViews[accessor.bufferView];
      const semantic = gltfToEngineSemanticMap[attrib];
      const size = getNumComponents(accessor.type) * getComponentSizeInBytes(accessor.componentType);
      const stride = bufferView.hasOwnProperty('byteStride') ? bufferView.byteStride : size;
      sourceDesc[semantic] = {
        buffer: accessorData.buffer,
        size: size,
        offset: accessorData.byteOffset,
        stride: stride,
        count: accessor.count,
        components: getNumComponents(accessor.type),
        type: getComponentType(accessor.componentType),
        normalize: accessor.normalized
      };
    }

    // generate normals if they're missing (this should probably be a user option)
    if (!sourceDesc.hasOwnProperty(pc.SEMANTIC_NORMAL)) {
      generateNormals(sourceDesc, indices);
    }

    // create and store it in the dictionary
    vb = createVertexBufferInternal(device, sourceDesc, flipV);
    vertexBufferDict[vbKey] = vb;
  }

  return vb;
};

function getPrimitiveType(primitive: any) {
  if (!primitive.hasOwnProperty('mode')) {
    return pc.PRIMITIVE_TRIANGLES;
  }

  switch (primitive.mode) {
    case 0: return pc.PRIMITIVE_POINTS;
    case 1: return pc.PRIMITIVE_LINES;
    case 2: return pc.PRIMITIVE_LINELOOP;
    case 3: return pc.PRIMITIVE_LINESTRIP;
    case 4: return pc.PRIMITIVE_TRIANGLES;
    case 5: return pc.PRIMITIVE_TRISTRIP;
    case 6: return pc.PRIMITIVE_TRIFAN;
    default: return pc.PRIMITIVE_TRIANGLES;
  }
};

function getDequantizeFunc(srcType: any) {
  // see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data
  switch (srcType) {
    case pc.TYPE_INT8: return (x: any) => Math.max(x / 127.0, -1.0);
    case pc.TYPE_UINT8: return (x: any) => x / 255.0;
    case pc.TYPE_INT16: return (x: any) => Math.max(x / 32767.0, -1.0);
    case pc.TYPE_UINT16: return (x: any) => x / 65535.0;
    default: return (x: any) => x;
  }
};

function dequantizeArray(dstArray: any, srcArray: any, srcType: any) {
  const convFunc = getDequantizeFunc(srcType);
  const len = srcArray.length;
  for (let i = 0; i < len; ++i) {
    dstArray[i] = convFunc(srcArray[i]);
  }
  return dstArray;
};

function getAccessorBoundingBox(gltfAccessor: any): pc.BoundingBox | null {
  let min = gltfAccessor.min;
  let max = gltfAccessor.max;
  if (!min || !max) {
    return null;
  }

  if (gltfAccessor.normalized) {
    const ctype = getComponentType(gltfAccessor.componentType);
    min = dequantizeArray([], min, ctype);
    max = dequantizeArray([], max, ctype);
  }

  return new pc.BoundingBox(
    new pc.Vec3((max[0] + min[0]) * 0.5, (max[1] + min[1]) * 0.5, (max[2] + min[2]) * 0.5),
    new pc.Vec3((max[0] - min[0]) * 0.5, (max[1] - min[1]) * 0.5, (max[2] - min[2]) * 0.5)
  );
};

function getAccessorDataFloat32(gltfAccessor: any, bufferViews: any) {
  const data = getAccessorData(gltfAccessor, bufferViews, true);
  if (data instanceof Float32Array || !gltfAccessor.normalized) {
    // if the source data is quantized (say to int16), but not normalized
    // then reading the values of the array is the same whether the values
    // are stored as float32 or int16. so probably no need to convert to
    // float32.
    return data;
  }

  const float32Data = new Float32Array(data.length);
  dequantizeArray(float32Data, data, getComponentType(gltfAccessor.componentType));
  return float32Data;
};

function createMesh(
  device: any,
  gltfMesh: any,
  accessors: any, bufferViews: any, flipV: any, vertexBufferDict: any) {
  const meshes: pc.Mesh[] = [];

  gltfMesh.primitives.forEach(function (primitive: any) {

    let primitiveType, vertexBuffer, numIndices;
    let indices = null;
    let canUseMorph = true;

    // // try and get draco compressed data first
    // if (primitive.hasOwnProperty('extensions')) {
    //   const extensions = primitive.extensions;
    //   if (extensions.hasOwnProperty('KHR_draco_mesh_compression')) {

    //     // access DracoDecoderModule
    //     const decoderModule = window.DracoDecoderModule;
    //     if (decoderModule) {
    //       const extDraco = extensions.KHR_draco_mesh_compression;
    //       if (extDraco.hasOwnProperty('attributes')) {
    //         const uint8Buffer = bufferViews[extDraco.bufferView];
    //         const buffer = new decoderModule.DecoderBuffer();
    //         buffer.Init(uint8Buffer, uint8Buffer.length);

    //         const decoder = new decoderModule.Decoder();
    //         const geometryType = decoder.GetEncodedGeometryType(buffer);

    //         let outputGeometry, status;
    //         switch (geometryType) {
    //           case decoderModule.POINT_CLOUD:
    //             primitiveType = pc.PRIMITIVE_POINTS;
    //             outputGeometry = new decoderModule.PointCloud();
    //             status = decoder.DecodeBufferToPointCloud(buffer, outputGeometry);
    //             break;
    //           case decoderModule.TRIANGULAR_MESH:
    //             primitiveType = pc.PRIMITIVE_TRIANGLES;
    //             outputGeometry = new decoderModule.Mesh();
    //             status = decoder.DecodeBufferToMesh(buffer, outputGeometry);
    //             break;
    //           case decoderModule.INVALID_GEOMETRY_TYPE:
    //           default:
    //             break;
    //         }

    //         if (!status || !status.ok() || outputGeometry.ptr == 0) {
    //           callback("Failed to decode draco compressed asset: " +
    //             (status ? status.error_msg() : ('Mesh asset - invalid draco compressed geometry type: ' + geometryType)));
    //           return;
    //         }

    //         // indices
    //         const numFaces = outputGeometry.num_faces();
    //         if (geometryType === decoderModule.TRIANGULAR_MESH) {
    //           const bit32 = outputGeometry.num_points() > 65535;

    //           numIndices = numFaces * 3;
    //           const dataSize = numIndices * (bit32 ? 4 : 2);
    //           const ptr = decoderModule._malloc(dataSize);

    //           if (bit32) {
    //             decoder.GetTrianglesUInt32Array(outputGeometry, dataSize, ptr);
    //             indices = new Uint32Array(decoderModule.HEAPU32.buffer, ptr, numIndices).slice();
    //           } else {
    //             decoder.GetTrianglesUInt16Array(outputGeometry, dataSize, ptr);
    //             indices = new Uint16Array(decoderModule.HEAPU16.buffer, ptr, numIndices).slice();
    //           }

    //           decoderModule._free(ptr);
    //         }

    //         // vertices
    //         vertexBuffer = createVertexBufferDraco(device, outputGeometry, extDraco, decoder, decoderModule, indices, flipV);

    //         // clean up
    //         decoderModule.destroy(outputGeometry);
    //         decoderModule.destroy(decoder);
    //         decoderModule.destroy(buffer);

    //         // morph streams are not compatible with draco compression, disable morphing
    //         canUseMorph = false;
    //       }
    //     }
    //   }
    // }

    // if mesh was not constructed from draco data, use uncompressed
    if (!vertexBuffer) {
      indices = primitive.hasOwnProperty('indices') ? getAccessorData(accessors[primitive.indices], bufferViews, true) : null;
      vertexBuffer = createVertexBuffer(device, primitive.attributes, indices, accessors, bufferViews, flipV, vertexBufferDict);
      primitiveType = getPrimitiveType(primitive);
    }

    let mesh = null;
    if (vertexBuffer) {
      // build the mesh
      mesh = new pc.Mesh(device) as any;
      mesh.vertexBuffer = vertexBuffer;
      mesh.primitive[0].type = primitiveType;
      mesh.primitive[0].base = 0;
      mesh.primitive[0].indexed = (indices !== null);

      // index buffer
      if (indices !== null) {
        let indexFormat;
        if (indices instanceof Uint8Array) {
          indexFormat = pc.INDEXFORMAT_UINT8;
        } else if (indices instanceof Uint16Array) {
          indexFormat = pc.INDEXFORMAT_UINT16;
        } else {
          indexFormat = pc.INDEXFORMAT_UINT32;
        }

        // 32bit index buffer is used but not supported
        if (indexFormat === pc.INDEXFORMAT_UINT32 && !device.extUintElement) {

          // #if _DEBUG
          if (vertexBuffer.numVertices > 0xFFFF) {
            console.warn("Glb file contains 32bit index buffer but these are not supported by this device - it may be rendered incorrectly.");
          }
          // #endif

          // convert to 16bit
          indexFormat = pc.INDEXFORMAT_UINT16;
          indices = new Uint16Array(indices);
        }

        const indexBuffer = new pc.IndexBuffer(device, indexFormat, indices.length, pc.BUFFER_STATIC, indices);
        mesh.indexBuffer[0] = indexBuffer;
        mesh.primitive[0].count = indices.length;
      } else {
        mesh.primitive[0].count = vertexBuffer.numVertices;
      }

      // TODO: Refactor, we should not store temporary data on the mesh.
      // The container should store some mapping table instead.
      mesh.materialIndex = primitive.material;

      let accessor = accessors[primitive.attributes.POSITION];
      mesh.aabb = getAccessorBoundingBox(accessor);

      // morph targets
      if (canUseMorph && primitive.hasOwnProperty('targets')) {
        const targets: pc.MorphTarget[] = [];

        primitive.targets.forEach(function (target: any, index: number) {
          const options: any = {};

          if (target.hasOwnProperty('POSITION')) {
            accessor = accessors[target.POSITION];
            options.deltaPositions = getAccessorDataFloat32(accessor, bufferViews);
            options.deltaPositionsType = pc.TYPE_FLOAT32;
            options.aabb = getAccessorBoundingBox(accessor);
          }

          if (target.hasOwnProperty('NORMAL')) {
            accessor = accessors[target.NORMAL];
            // NOTE: the morph targets can't currently accept quantized normals
            options.deltaNormals = getAccessorDataFloat32(accessor, bufferViews);
            options.deltaNormalsType = pc.TYPE_FLOAT32;
          }

          // name if specified
          if (gltfMesh.hasOwnProperty('extras') &&
            gltfMesh.extras.hasOwnProperty('targetNames')) {
            options.name = gltfMesh.extras.targetNames[index];
          } else {
            options.name = index.toString(10);
          }

          // default weight if specified
          if (gltfMesh.hasOwnProperty('weights')) {
            options.defaultWeight = gltfMesh.weights[index];
          }

          targets.push(new pc.MorphTarget(options));
        });

        mesh.morph = new pc.Morph(targets, device);
      }
    }

    meshes.push(mesh);
  });

  return meshes;
};

export function createMeshes(device: pc.GraphicsDevice, gltf: any, bufferViews: any, flipV: boolean) {
  if (!gltf.hasOwnProperty('meshes') || gltf.meshes.length === 0 ||
    !gltf.hasOwnProperty('accessors') || gltf.accessors.length === 0 ||
    !gltf.hasOwnProperty('bufferViews') || gltf.bufferViews.length === 0) {
    return [];
  }

  // dictionary of vertex buffers to avoid duplicates
  const vertexBufferDict = {};

  return gltf.meshes.map(function (gltfMesh: any) {
    return createMesh(device, gltfMesh, gltf.accessors, bufferViews, flipV, vertexBufferDict);
  });
}

var createModel = function (name: string, meshGroup: any, materials: any, defaultMaterial: any) {
  var model = new pc.Model();
  model.graph = new pc.Entity(name);
  meshGroup.forEach(function (meshAndMaterial: any) {
    var mesh = meshAndMaterial.mesh;
    var materialIndex = meshAndMaterial.materialIndex;
    var material = (materialIndex === undefined) ? defaultMaterial : materials[materialIndex];
    var meshInstance = new pc.MeshInstance(meshAndMaterial, material, model.graph);
    if (meshAndMaterial.morph) {
      var morphInstance = new pc.MorphInstance(mesh.morph);
      if (mesh.weights) {
        for (var wi = 0; wi < mesh.weights.length; wi++) {
          morphInstance.setWeight(wi, mesh.weights[wi]);
        }
      }
      meshInstance.morphInstance = morphInstance;
      model.morphInstances.push(morphInstance);
    }
    model.meshInstances.push(meshInstance);
  });
  return model;
};

export function createModels(meshGroups: any, materials: any, defaultMaterial: any) {
  return meshGroups.map(function (meshGroup: pc.Asset, meshGroupIndex: number): pc.Model {
    return createModel('model_' + meshGroupIndex, meshGroup, materials, defaultMaterial);
  });
};

export function createModelByNode(gltf: any, models: any, skins: any, skinInstances: any) {
  if (!gltf.hasOwnProperty('nodes') || gltf.nodes.length === 0) {
    return [];
  }
  return gltf.nodes.map(function (gltfNode: any) {
    if (!gltfNode.hasOwnProperty('mesh')) {
      return null;
    }
    var model = models[gltfNode.mesh].clone();
    var skin = gltfNode.hasOwnProperty('skin') ? skins[gltfNode.skin] : null;
    var skinInstance = gltfNode.hasOwnProperty('skin') ? skinInstances[gltfNode.skin] : null;
    if (skin !== null && skinInstance !== null) {
      model.skinInstances = model.meshInstances.map(function (meshInstance: any) {
        meshInstance.mesh.skin = skin;
        meshInstance.skinInstance = skinInstance;
        return skinInstance;
      });
    }
    return model;
  });
};