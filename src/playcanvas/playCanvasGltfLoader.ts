import * as pc from "playcanvas";
import { ExtensionRegistry, ExtensionParser } from "../core/extensions/extensionParser";
import { LightMapExtensionParser } from "../core/extensions/lightMapParser";
import { GlbLoadedContainerType } from "../core/customGltfLoader";

export type GltfData = {
  scenes: pc.Entity[];
  defaultScene: number;
};

export class PlayCanvasGltfLoader {
  private _app: pc.Application;
  public get app(): pc.Application {
    return this._app;
  }
  private _registry: ExtensionRegistry;
  public get registry(): ExtensionRegistry {
    return this._registry;
  }

  public constructor(private application: pc.Application) {
    this._app = application;
    this._registry = new ExtensionRegistry();
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
          this.registry.containerAssetOptions

        );
        assets.add(asset);
      }
      asset.once("load", loaded => resolve(loaded));
      asset.once("error", err => reject(err));
      assets.load(asset);
    });
  }

  public async load(url: string, fileName?: string): Promise<GltfData> {

    const extensions: ExtensionParser[] = [
      new LightMapExtensionParser()
    ];
    this._clearExtensions();
    this._registerExtensions(extensions);

    try {
      const loadedAsset = await this._loadAsset(url, fileName);
      if (!loadedAsset) {
        throw new Error("Asset not found");
      }
      const container = loadedAsset.resource;
      if (!container) {
        throw new Error("Asset is empty");
      }
      this._postParseExtensions(extensions, container);
      this._unregisterExtensions(extensions);
      return {
        scenes: container.scenes,
        defaultScene: 0
      }
    } catch (e) {
      this._unregisterExtensions(extensions);
      throw e;
    }
  }


  private _clearExtensions() {
    this.registry.removeAll();
  }

  private _registerExtensions(extensions: ExtensionParser[]) {
    extensions.forEach(e => e.register(this.registry));
  }

  private _unregisterExtensions(extensions: ExtensionParser[]) {
    extensions.forEach(e => e.unregister(this.registry));
  }

  private _postParseExtensions(
    extensions: ExtensionParser[],
    container: GlbLoadedContainerType,
  ) {
    extensions.forEach(e => e.postParse(container));
  }
}