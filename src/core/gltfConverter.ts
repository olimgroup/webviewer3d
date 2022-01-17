
import * as pc from "playcanvas";
import { createNode } from "./generators/gltfNodeGenerator"
import { createMaterial } from "./generators/gltfMaterialGenerator"
import { createMeshGroup } from "./generators/gltfMeshGenerator"

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

export function createScenes(gltf: any, nodes: pc.Entity[], options: any): pc.Entity[] {
  if (!gltf.hasOwnProperty('scenes') || gltf.scenes.length === 0) {
    return [];
  }
  const createScene = (sceneData: any, sceneIndex: number, nodes: pc.Entity[]) => {
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

export function createMaterials(gltf: any, textures: pc.Texture[], options: any): pc.StandardMaterial[] {
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
    var material = process(gltfMaterial, textures);
    if (postprocess) {
      postprocess(gltfMaterial, material);
    }
    return material;
  });
};

export function createMeshes(device: pc.GraphicsDevice, gltf: any, bufferViews: any) {
  if (!gltf.hasOwnProperty('meshes') || gltf.meshes.length === 0 ||
    !gltf.hasOwnProperty('accessors') || gltf.accessors.length === 0 ||
    !gltf.hasOwnProperty('bufferViews') || gltf.bufferViews.length === 0) {
    return [];
  }
  const vertexBufferDict = {};
  return gltf.meshes.map(function (gltfMesh: any) {
    return createMeshGroup(device, gltfMesh, gltf.accessors, bufferViews, vertexBufferDict);
  });
}

export function createModels(meshGroups: any, materials: any, defaultMaterial: any) {
  const createModel = (name: string, meshGroup: any, materials: any, defaultMaterial: any): pc.Model => {
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
  return meshGroups.map(function (meshGroup: pc.Asset, meshGroupIndex: number): pc.Model {
    return createModel('model_' + meshGroupIndex, meshGroup, materials, defaultMaterial);
  });
};

export function createModelByNode(gltf: any, models: any, skins: any, skinInstances: any): pc.Entity[] {
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