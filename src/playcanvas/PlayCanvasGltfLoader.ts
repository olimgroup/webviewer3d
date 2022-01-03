
import * as pc from "@animech-public/playcanvas";
import { ExtensionRegistry } from "./extensions/ExtensionRegistry";
import { ExtensionParser } from "./extensions/ExtensionParser";
import { LightMapExtensionParser } from "./extensions/LightMapExtensionParser";

export type GltfSceneData = {
    root: pc.Entity;
};

export type GltfData = {
    asset: pc.Asset;
    scenes: GltfSceneData[];
    defaultScene: number;
};

export class PlayCanvasGltfLoader {
    private _extensionRegistry: ExtensionRegistry;
    public constructor(private _app: pc.Application) {
        this._extensionRegistry = new ExtensionRegistry();
    }

    private async _loadAsset(url: string, fileName?: string): Promise<pc.Asset | undefined> {
        return new Promise<pc.Asset | undefined>((resolve, reject) => {
            const { assets } = this._app;
            const fileUrl = fileName ? url : pc.path.join("../..", url);

            const assetName = pc.path.getBasename(fileName || fileUrl);
            let asset = assets.getByUrl(fileUrl);
            if (!asset) {
                asset = new pc.Asset(
                    assetName,
                    "container",
                    { url: fileUrl, filename: fileName || assetName },
                    null,
                    this._extensionRegistry.containerAssetOptions,
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
        this._extensionRegistry.removeAll();
    }
    private _registerExtensions(extensions: ExtensionParser[]) {
        extensions.forEach(e => e.register(this._extensionRegistry));
    }

    private _unregisterExtensions(extensions: ExtensionParser[]) {
        extensions.forEach(e => e.unregister(this._extensionRegistry));
    }

    private _postParseExtensions(
        extensions: ExtensionParser[],
        container: pc.ContainerResource,
    ) {
        extensions.forEach(e => e.postParse(container));
    }

    private _addModelMaterialMappings(container: pc.ContainerResource) {
        const materials = container.materials;

        // Add missing material mappings to all model assets.
        // We need them to support restoring default materials for a model via variants.
        this._app.assets
            .filter(
                asset =>
                    asset.type === "model" && !!asset.resource && !asset.data?.mapping,
            )
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
            new LightMapExtensionParser(),
        ];

        this._clearExtensions();
        this._registerExtensions(extensions);

        try {
            const asset = await this._loadAsset(url, fileName);
            if (!asset) {
                throw new Error("Asset not found");
            }
            const container = asset.resource as pc.ContainerResource | undefined;
            if (!container) {
                throw new Error("Asset is empty");
            }
            
            // const defaultScene = container.scene;
            // if (!defaultScene) {
            //     throw new Error("Asset has no default scene");
            // }

            this._postParseExtensions(extensions, container);
            this._unregisterExtensions(extensions);
            this._addModelMaterialMappings(container);

            return {
                asset,
                scenes: container.scenes.map<GltfSceneData>(sceneRoot => {
                    return {
                        root: sceneRoot
                    };
                }),
                defaultScene:0// container.scenes.indexOf(defaultScene),
            };
        } catch (e) {
            this._unregisterExtensions(extensions);
            throw e;
        }
    }

    public unload(data: GltfData) {
        this._app.assets.remove(data.asset);
        data.asset.unload();
    }
}