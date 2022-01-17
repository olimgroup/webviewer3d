import * as pc from "playcanvas";

var tempMat = new pc.Mat4();
var tempVec = new pc.Vec3();

export const createNode = (gltfNode: any, nodeIndex: number): pc.Entity => {
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
  if (gltfNode.hasOwnProperty('extensions')) {

  }
  return entity;
}