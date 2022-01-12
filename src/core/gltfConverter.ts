
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

var createMaterial = function (gltfMaterial: any, textures: pc.Asset[], disableFlipV: boolean) {
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

export function createMaterials(gltf: any, textures: pc.Asset[], options: any, disableFlipV: boolean) {
  if (!gltf.hasOwnProperty('materials') || gltf.materials.length === 0) {
    return [];
  }
  var preprocess = options && options.material && options.material.preprocess;
  var process = options && options.material && options.material.process || createMaterial;
  var postprocess = options && options.material && options.material.postprocess;
  return gltf.materials.map(function (gltfMaterial: any) {
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