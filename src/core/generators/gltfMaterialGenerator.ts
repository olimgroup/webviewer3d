
import * as pc from "playcanvas";

const diffuseChunk = ["#ifdef MAPCOLOR", "uniform vec3 material_diffuse;", "#endif", "", "#ifdef MAPTEXTURE", "uniform sampler2D texture_diffuseMap;", "#endif", "", "void getAlbedo() {", "	dAlbedo = vec3(1.0);", "", "#ifdef MAPCOLOR", "	dAlbedo *= material_diffuse.rgb;", "#endif", "", "#ifdef MAPTEXTURE", "	dAlbedo *= gammaCorrectInput(addAlbedoDetail(texture2D(texture_diffuseMap, $UV).$CH));", "#endif", "", "#ifdef MAPVERTEX", "	dAlbedo *= saturate(vVertexColor.$VC);", "#endif", "}"].join('\n');
const glossChunk = ["#ifdef MAPFLOAT", "uniform float material_shininess;", "#endif", "", "#ifdef MAPTEXTURE", "uniform sampler2D texture_glossMap;", "#endif", "", "void getGlossiness() {", "		dGlossiness = 1.0;", "", "#ifdef MAPFLOAT", "		dGlossiness *= material_shininess;", "#endif", "", "#ifdef MAPTEXTURE", "		dGlossiness *= texture2D(texture_glossMap, $UV).$CH;", "#endif", "", "#ifdef MAPVERTEX", "		dGlossiness *= saturate(vVertexColor.$VC);", "#endif", "", "		dGlossiness = 1.0 - dGlossiness;", "", "		dGlossiness += 0.0000001;", "}"].join('\n');
const specularChunk = ["#ifdef MAPCOLOR", "uniform vec3 material_specular;", "#endif", "", "#ifdef MAPTEXTURE", "uniform sampler2D texture_specularMap;", "#endif", "", "void getSpecularity() {", "		dSpecularity = vec3(1.0);", "", "		#ifdef MAPCOLOR", "				dSpecularity *= material_specular;", "		#endif", "", "		#ifdef MAPTEXTURE", "				vec3 srgb = texture2D(texture_specularMap, $UV).$CH;", "				dSpecularity *= vec3(pow(srgb.r, 2.2), pow(srgb.g, 2.2), pow(srgb.b, 2.2));", "		#endif", "", "		#ifdef MAPVERTEX", "				dSpecularity *= saturate(vVertexColor.$VC);", "		#endif", "}"].join('\n');
const clearCoatGlossChunk = ["#ifdef MAPFLOAT", "uniform float material_clearCoatGlossiness;", "#endif", "", "#ifdef MAPTEXTURE", "uniform sampler2D texture_clearCoatGlossMap;", "#endif", "", "void getClearCoatGlossiness() {", "		ccGlossiness = 1.0;", "", "#ifdef MAPFLOAT", "		ccGlossiness *= material_clearCoatGlossiness;", "#endif", "", "#ifdef MAPTEXTURE", "		ccGlossiness *= texture2D(texture_clearCoatGlossMap, $UV).$CH;", "#endif", "", "#ifdef MAPVERTEX", "		ccGlossiness *= saturate(vVertexColor.$VC);", "#endif", "", "		ccGlossiness = 1.0 - ccGlossiness;", "", "		ccGlossiness += 0.0000001;", "}"].join('\n');
const zeros = [0, 0];
const ones = [1, 1];

const extractTextureTransform = (source: any, material: any, maps: string[]) => {
  const texCoord = source.texCoord;
  if (texCoord) {
    for (let map = 0; map < maps.length; ++map) {
      material[maps[map] + 'MapUv'] = texCoord;
    }
  }
  const textureTransform = source.extensions?.KHR_texture_transform;
  if (textureTransform) {
    const offset = textureTransform.offset || zeros;
    const scale = textureTransform.scale || ones;
    const rotation = textureTransform.rotation ? -textureTransform.rotation * pc.math.RAD_TO_DEG : 0;
    const tilingVec = new pc.Vec2(scale[0], scale[1]);
    const offsetVec = new pc.Vec2(offset[0], 1.0 - scale[1] - offset[1]);
    for (let map = 0; map < maps.length; ++map) {
      material[maps[map] + "MapTiling"] = tilingVec;
      material[maps[map] + "MapOffset"] = offsetVec;
      material[maps[map] + "MapRotation"] = rotation;
    }
  }
};

export const createMaterial = (gltfMaterial: any, textures: pc.Texture[]): pc.StandardMaterial => {

  var material = new pc.StandardMaterial();
  material.occludeSpecular = pc.SPECOCC_NONE;
  material.diffuseTint = true;
  material.diffuseVertexColor = true;
  material.specularTint = true;
  material.specularVertexColor = true;
  //material.chunks.diffusePS = diffuseChunk;

  if (gltfMaterial.hasOwnProperty('name')) {
    material.name = gltfMaterial.name;
  }

  var color: number[];
  var texture: pc.Texture;

  if (gltfMaterial.hasOwnProperty('extensions')) {
    if (gltfMaterial.extensions.hasOwnProperty('KHR_materials_pbrSpecularGlossiness')) {
      const specData = gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness;

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
        material.diffuseMap = texture;
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

