import * as pc from "playcanvas";
import { ProcessRegistry } from "../core/process/processRegistry";

export type GltfData = {
  scenes: pc.Entity[];
  defaultScene: number;
};

export class PlayCanvasGltfLoader {
  private _app: pc.Application;
  public get app(): pc.Application {
    return this._app;
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
          ProcessRegistry
        );
        assets.add(asset);
      }
      asset.once("load", loaded => resolve(loaded));
      asset.once("error", err => reject(err));
      assets.load(asset);
    });
  }

  public async load(url: string, fileName?: string): Promise<GltfData> {

    const loadedAsset = await this._loadAsset(url, fileName);
    if (!loadedAsset) {
      throw new Error("Asset not found");
    }

    const container = loadedAsset.resource;
    if (!container) {
      throw new Error("Asset is empty");
    }
    console.log(container);
    return {
      scenes: container.scenes,
      defaultScene: 0
    }
  }
}