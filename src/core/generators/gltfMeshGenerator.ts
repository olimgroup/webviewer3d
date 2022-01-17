import * as pc from "playcanvas";

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
const typedArrayTypesByteSize = [1, 1, 2, 2, 4, 4, 4];
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

function createVertexBufferInternal(device: any, sourceDesc: any) {
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

  vertexBuffer.unlock();

  return vertexBuffer;
};

function createVertexBuffer(device: any, attributes: any, indices: any, accessors: any, bufferViews: any, vertexBufferDict: any) {

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
    vb = createVertexBufferInternal(device, sourceDesc);
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

export const createMeshGroup = (device: any, gltfMesh: any, accessors: any, bufferViews: any, vertexBufferDict: any): pc.Mesh[] => {
  const meshes: pc.Mesh[] = [];

  gltfMesh.primitives.forEach(function (primitive: any) {

    let primitiveType, vertexBuffer;
    let indices = null;
    let canUseMorph = true;

    // if mesh was not constructed from draco data, use uncompressed
    if (!vertexBuffer) {
      indices = primitive.hasOwnProperty('indices') ? getAccessorData(accessors[primitive.indices], bufferViews, true) : null;
      vertexBuffer = createVertexBuffer(device, primitive.attributes, indices, accessors, bufferViews, vertexBufferDict);
      primitiveType = getPrimitiveType(primitive);
    }

    let mesh = null;
    if (vertexBuffer) {
      mesh = new pc.Mesh(device) as any;
      mesh.vertexBuffer = vertexBuffer;
      mesh.primitive[0].type = primitiveType;
      mesh.primitive[0].base = 0;
      mesh.primitive[0].indexed = (indices !== null);

      if (indices !== null) {
        let indexFormat;
        if (indices instanceof Uint8Array) {
          indexFormat = pc.INDEXFORMAT_UINT8;
        } else if (indices instanceof Uint16Array) {
          indexFormat = pc.INDEXFORMAT_UINT16;
        } else {
          indexFormat = pc.INDEXFORMAT_UINT32;
        }

        if (indexFormat === pc.INDEXFORMAT_UINT32 && !device.extUintElement) {

          if (vertexBuffer.numVertices > 0xFFFF) {
            console.warn("Glb file contains 32bit index buffer but these are not supported by this device - it may be rendered incorrectly.");
          }
          indexFormat = pc.INDEXFORMAT_UINT16;
          indices = new Uint16Array(indices);
        }

        const indexBuffer = new pc.IndexBuffer(device, indexFormat, indices.length, pc.BUFFER_STATIC, indices);
        mesh.indexBuffer[0] = indexBuffer;
        mesh.primitive[0].count = indices.length;
      } else {
        mesh.primitive[0].count = vertexBuffer.numVertices;
      }

      mesh.materialIndex = primitive.material;

      let accessor = accessors[primitive.attributes.POSITION];
      mesh.aabb = getAccessorBoundingBox(accessor);

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
            options.deltaNormals = getAccessorDataFloat32(accessor, bufferViews);
            options.deltaNormalsType = pc.TYPE_FLOAT32;
          }

          if (gltfMesh.hasOwnProperty('extras') &&
            gltfMesh.extras.hasOwnProperty('targetNames')) {
            options.name = gltfMesh.extras.targetNames[index];
          } else {
            options.name = index.toString(10);
          }

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