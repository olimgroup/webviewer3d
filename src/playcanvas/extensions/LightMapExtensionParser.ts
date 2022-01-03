import * as pc from "@animech-public/playcanvas";

import { NodeLightmap } from "../scripts/LightMapUE4";
import { ExtensionParser } from "./ExtensionParser";
import { ExtensionRegistry } from "./ExtensionRegistry";

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
    registry.node.add(this.name, {
      postParse: this._nodePostParse.bind(this),
    });
  }

  public unregister(registry: ExtensionRegistry) {
    registry.node.remove(this.name);
    NodeLightmap.clearCachedMaterialMappings();
  }

  public postParse(container: pc.ContainerResource) {
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
      
      
      const sc = data.node.addComponent("script");//.addComponent("script") as pc.ScriptComponent;
      // sc.create(NodeLightmap, {
      //   attributes: {
      //     texture,
      //     texCoord: texCoord ?? 0,
      //     lightmapAdd,
      //     lightmapScale,
      //     coordinateScaleBias,
      //   },
      // });

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
