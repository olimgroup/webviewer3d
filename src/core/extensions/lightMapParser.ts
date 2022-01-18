
import { ScriptComponent } from "playcanvas";
import { GlbLoadedContainerType } from "../customGltfLoader";
import { ExtensionParser, ExtensionRegistry } from "./extensionParser"
import { LightMapUE4 } from "../../playcanvas/scripts/lightMapUE4";

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

type ExtensionRawData = {
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
  private nodeLightmapDatas: NodeLightmapData[] = [];
  public get name() {
    return "EPIC_lightmap_textures";
  }

  public register(registry: ExtensionRegistry) {
    registry.node.add(this.name, {
      extensionParse: this.extensionParse.bind(this),
    });
  }

  public unregister(registry: ExtensionRegistry) {
    registry.node.remove(this.name);
  }
  extensionParse(node: pc.Entity, extensionData: NodeExtensionData, rootData: ExtensionRawData) {
    const lightmap = rootData.extensions?.EPIC_lightmap_textures?.lightmaps?.[extensionData.lightmap];
    if (!lightmap) {
      console.log(`Unable to find lightmap with index ${extensionData.lightmap} for node '${node.name}'`,);
      return;
    }
    this.nodeLightmapDatas.push({
      node: node,
      ...lightmap,
    });
  }
  postParse(container: GlbLoadedContainerType): void {
    this.nodeLightmapDatas.forEach(data => {
      const {
        node,
        lightmapScale,
        lightmapAdd,
        coordinateScaleBias,
        texture: {
          texCoord,
          index
        },
      } = data;

      if (!coordinateScaleBias || !lightmapAdd || !lightmapScale || index === undefined) {
        console.log(`Node '${node.name}' has invalid data`, data);
        return;
      }

      const texture = container.textures[index];
      if (!texture) {
        console.log(`Node '${node.name}' is using an invalid lightmap texture`);
        return;
      }

      const scriptComponent = node.addComponent("script") as ScriptComponent;
      const attr = {
        texture,
        texCoord: texCoord ?? 0,
        lightmapAdd,
        lightmapScale,
        coordinateScaleBias,
      };

      scriptComponent.create(LightMapUE4, {
        attributes: {
          texture,
          texCoord: texCoord ?? 0,
          lightmapAdd,
          lightmapScale,
          coordinateScaleBias,
        },
      });
    });
  }
}