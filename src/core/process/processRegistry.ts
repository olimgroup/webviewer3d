
export type GltfRaw = any;


const bufferProcess = {
  preprocess: (gltf: GltfRaw) => { },
  //processAsync: (gltf: GltfRaw, callback: any) => { callback(); },
  postprocess: (gltf: GltfRaw, bufferArray: Uint8Array) => { }
}

const bufferViewProcess = {
  preprocess: (gltf: GltfRaw) => { },
  //processAsync: (gltf: GltfRaw, bufferArray: Uint8Array, callback: any) => { callback(); },
  postprocess: (gltf: GltfRaw, bufferArray: Uint8Array) => { }
}

const loadImageProcess = {
  preprocess: (gltf: GltfRaw) => { },
  //processAsync: (gltf: GltfRaw, callback: any) => { callback(); },
  postprocess: (gltf: GltfRaw, textureAsset: pc.Texture) => { }
}

const loadTextureProcess = {
  preprocess: (gltf: GltfRaw) => { },
  //processAsync: (gltf: GltfRaw, gltfImages: GltfRaw, callback: any) => { callback(); },
  postprocess: (gltf: GltfRaw, textureAsset: pc.Asset) => { }
}

const containerProcess = {
  preprocess: (gltf: GltfRaw) => { },
  postprocess: (gltf: GltfRaw, result: object) => { }
}

const nodeProcess = {
  preprocess: (gltf: GltfRaw) => { },
  postprocess: (gltf: GltfRaw, entity: pc.Entity) => {
    console.log(gltf);
  }
}

const sceneProcess = {
  preprocess: (gltf: GltfRaw) => { },
  postprocess: (gltf: GltfRaw, entity: pc.Entity) => { }
}

const materialProcess = {
  preprocess: (gltf: GltfRaw) => { },
  postprocess: (gltf: GltfRaw, material: pc.StandardMaterial) => { }
}

export const ProcessRegistry: object = {
  buffer: bufferProcess,
  bufferView: bufferViewProcess,
  image: loadImageProcess,
  texture: loadTextureProcess,
  container: containerProcess,
  node: nodeProcess,
  scene: sceneProcess,
  material: materialProcess,
}