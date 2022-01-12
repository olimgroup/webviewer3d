import * as pc from "playcanvas";
import { NodeLightmap } from "../scripts/lightMap";
import { ExtensionParser } from "./extensionParser";
import { ExtensionRegistry } from "./extensionRegistry";
import { GlbContainerAssets } from "../../core/customGltfLoader"

interface OlimContainerResource extends pc.ContainerResource {
  scene: pc.Entity | null;
  scenes: pc.Entity[];
  cameras: pc.CameraComponent[];
  lights: pc.LightComponent[];
  nodes: pc.Entity[];
  animationIndicesByNode: number[][];
  animations: pc.Asset[];
  textures: pc.Asset[];
  materials: pc.Asset[];
  models: pc.Asset[];
  registry: pc.AssetRegistry;
}

type LightmapData = {
  lightmapAdd: number[];
  lightmapScale: number[];
  coordinateScaleBias: number[];
  texture: {
    index: number;
    texCoord?: number;
  };
};

type NodeExtensionData = {
  lightmap: number;
};

type RootData = {
  extensions?: {
    EPIC_lightmap_textures?: {
      lightmaps: LightmapData[];
    };
  };
};

type NodeLightmapData = LightmapData & {
  node: pc.Entity;
};

export class LightMapExtensionParser implements ExtensionParser {
  private _nodeLightmapDatas: NodeLightmapData[] = [];
  private _nodeLightmaps: NodeLightmap[] = [];

  public get name() {
    return "EPIC_lightmap_textures";
  }

  public register(registry: ExtensionRegistry) {
    registry._node.add(this.name, {
      postParse: this._nodePostParse.bind(this),
    });
  }

  public unregister(registry: ExtensionRegistry) {
    registry._node.remove(this.name);
    NodeLightmap.clearCachedMaterialMappings();
  }

  public postParse(container: GlbContainerAssets) {
    this._nodeLightmapDatas.forEach(data => {
      const {
        node,
        lightmapScale,
        lightmapAdd,
        coordinateScaleBias,
        texture: { texCoord, index },
      } = data;

      if (
        !coordinateScaleBias ||
        !lightmapAdd ||
        !lightmapScale ||
        index === undefined
      ) {
        return;
      }

      const texture = container.textures[index];
      if (!texture) {
        return;
      }

      (node.addComponent("script") as pc.ScriptComponent).create(NodeLightmap, {
        attributes: {
          texture,
          texCoord: texCoord ?? 0,
          lightmapAdd,
          lightmapScale,
          coordinateScaleBias,
        },
      });

      // TODO: cleanup of created resources when the scene or model is changed?
    });
  }

  private _nodePostParse(
    node: pc.Entity,
    extensionData: NodeExtensionData,
    rootData: RootData,
  ) {
    const lightmap =
      rootData.extensions?.EPIC_lightmap_textures?.lightmaps?.[
      extensionData.lightmap
      ];

    if (!lightmap) {
      return;
    }

    this._nodeLightmapDatas.push({
      node: node,
      ...lightmap,
    });
  }
}
