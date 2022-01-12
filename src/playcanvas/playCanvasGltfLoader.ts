import * as pc from "playcanvas";
import { LightMapExtensionParser } from "./extensions/lightMapExtensionParser";
import { ExtensionRegistry } from "./extensions/extensionRegistry";
import { ExtensionParser } from "./extensions/extensionParser";
import { GlbContainerAssets } from "../core/customGltfLoader";

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


export type GltfData = {
  asset: pc.Asset;
  scenes: pc.Entity[];
  defaultScene: number;
};

export class PlayCanvasGltfLoader {
  private _app: pc.Application;
  public get app(): pc.Application {
    return this._app;
  }

  private _extensionRegistry!: ExtensionRegistry;
  public get extensionRegistry(): ExtensionRegistry {
    if (!this._extensionRegistry)
      this._extensionRegistry = new ExtensionRegistry();
    return this._extensionRegistry
  }
  public constructor(private application: pc.Application) {
    this._app = application;
  }

  private async _loadAsset(url: string, fileName?: string): Promise<pc.Asset> {
    return new Promise<pc.Asset>((resolve, reject) => {
      const { assets } = this.app;
      const fileUrl = fileName ? url : pc.path.join("../..", url);
      const assetName = pc.path.getBasename(fileName || fileUrl);
      let asset = assets.getByUrl(fileUrl);
      if (!asset) {
        asset = new pc.Asset(
          assetName,
          "customGltfLoader",
          { url: fileUrl, filename: fileName || assetName },
          null,
          this.extensionRegistry.containerAssetOptions
        );
        assets.add(asset);
      }
      if (asset.resource) {
        resolve(asset);
        return;
      }

      asset.once("load", loadedAsset => resolve(loadedAsset));
      asset.once("error", err => reject(err));
      assets.load(asset);
    });
  }


  private _clearExtensions() {
    this.extensionRegistry.removeAll();
  }

  private _registerExtensions(extensions: ExtensionParser[]) {
    extensions.forEach(e => e.register(this.extensionRegistry));
  }

  private _unregisterExtensions(extensions: ExtensionParser[]) {
    extensions.forEach(e => e.unregister(this.extensionRegistry));
  }

  private _postParseExtensions(
    extensions: ExtensionParser[],
    container: GlbContainerAssets,
  ) {
    extensions.forEach(e => e.postParse(container));
  }

  private _addModelMaterialMappings(container: GlbContainerAssets) {
    const materials = container.materials as pc.Asset[];
    this._app.assets
      .filter((asset) => {
        return asset.type === "model" && !!asset.resource && !asset.data?.mapping;
      })
      .forEach(model => {

        model.data = model.data ?? {};
        model.data.mapping = model.resource.meshInstances.map(
          (meshInstance: pc.MeshInstance) => ({
            material: materials.find(
              material => material.resource === meshInstance.material,
            )?.id,
          }),
        );
      });
  }

  public async load(url: string, fileName?: string): Promise<GltfData> {

    const extensions: ExtensionParser[] = [
      new LightMapExtensionParser()
    ];
    extensions.forEach(e => e.register(this.extensionRegistry));

    this._clearExtensions();
    this._registerExtensions(extensions);

    const loadedAsset = await this._loadAsset(url, fileName);
    if (!loadedAsset) {
      throw new Error("Asset not found");
    }
    const container = loadedAsset.resource as GlbContainerAssets | undefined;
    if (!container) {
      throw new Error("Asset is empty");
    }
    //this._postParseExtensions(extensions, container);
    this._unregisterExtensions(extensions);

    this._addModelMaterialMappings(container);

    return {
      asset: loadedAsset,
      scenes: container.scenes.map<pc.Entity>(sceneRoot => {
        return sceneRoot;
      }),
      defaultScene: 0
    }
  }
}