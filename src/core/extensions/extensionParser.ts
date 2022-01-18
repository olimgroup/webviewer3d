
import { GlbLoadedContainerType } from "../customGltfLoader"

type ExtensionData = any;
type ExtensionDataByName = { [extension: string]: ExtensionData };
type ObjectData = { extensions?: ExtensionDataByName };
type GltfData = any;
type ContainerAssetOptions = any;
type TextureAsset = Omit<pc.Asset, "resource"> & { resource: pc.Texture };

export type ExtensionPostParseCallback<
  TObject,
  TExtData = ExtensionData,
  TGltfData = GltfData> = (
    object: TObject,
    extensionData: TExtData,
    gltfData: TGltfData,
  ) => void;

export type ExtensionParsersByCallOrder<
  TObject,
  TExtData = ExtensionData,
  TGltfData = GltfData
  > = {
    extensionParse?: ExtensionPostParseCallback<TObject, TExtData, TGltfData>;
  };

export type ExtensionParsersByName<TObject> = {
  [extension: string]: ExtensionParsersByCallOrder<TObject>;
};

export class ExtensionParserCallbackRegistry<TObject> {
  private _extensions: ExtensionParsersByName<TObject> = {};

  public constructor() {
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.find = this.find.bind(this);
    this.index = this.index.bind(this);
    this.postParse = this.postParse.bind(this);
  }

  public add<TExtData, TRootExtData>(
    name: string,
    parsers: ExtensionParsersByCallOrder<TObject, TExtData, TRootExtData>,
  ) {
    if (this._extensions[name]) {
      return false;
    }
    this._extensions[name] = parsers;
    return true;
  }

  public remove(name: string) {
    if (!this._extensions[name]) {
      return;
    }
    delete this._extensions[name];
  }

  public removeAll() {
    this._extensions = {};
  }

  public find(name: string) {
    if (!this._extensions[name]) {
      return undefined;
    }
    return this._extensions[name];
  }

  public index() {
    return this._extensions;
  }

  public postParse(
    object: TObject,
    extensionDataByName: ExtensionDataByName = {},
    gltfData: GltfData = {},
  ) {
    const extensionParsers = this._extensions;
    Object.keys(extensionDataByName).forEach(extensionId => {
      const extensionParser = extensionParsers[extensionId];
      if (extensionParser && extensionParser.extensionParse) {
        extensionParser.extensionParse(
          object,
          extensionDataByName[extensionId],
          gltfData,
        );
      }
    });
  }
}

export class ExtensionRegistry {
  public constructor() {
    this.removeAll = this.removeAll.bind(this);
  }

  private _node = new ExtensionParserCallbackRegistry<pc.Entity>();
  public get node() {
    return this._node;
  }

  private _texture = new ExtensionParserCallbackRegistry<pc.Texture>();
  public get texture() {
    return this._texture;
  }

  public get containerAssetOptions(): ContainerAssetOptions {
    let gltfData: GltfData | undefined;

    function createPostProcessHandler<T>(registry: ExtensionParserCallbackRegistry<T>) {
      return (objectData: ObjectData, object: T) => {
        if (!objectData.extensions) {
          return;
        }
        if (!gltfData) {
          console.error(
            "Gltf data was not loaded before postParse, skipping postParse extensions for",
            objectData,
          );
          return;
        }
        registry.postParse(object, objectData.extensions, gltfData);
      };
    }

    return {
      container: {
        preprocess: (gltf: GltfData) => (gltfData = gltf),
      },
      node: { postprocess: createPostProcessHandler(this.node) },
      texture: {
        postprocess: (objectData: ObjectData, object: TextureAsset) => {
          if (!objectData.extensions) {
            return;
          }
          this.texture.postParse(object.resource, objectData.extensions);
        },
      },
    };
  }

  public removeAll() {
    this._node.removeAll();
    this._texture.removeAll();
  }
}

export interface ExtensionParser {
  name: string;
  register(registry: ExtensionRegistry): void;
  unregister(registry: ExtensionRegistry): void;
  postParse(container: GlbLoadedContainerType): void;
}
