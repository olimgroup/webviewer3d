import * as pc from "playcanvas";
import { ExtensionRegistry } from "./extensionRegistry";
import { GlbContainerAssets } from "../../core/customGltfLoader";
export interface ExtensionParser {
  name: string;
  register(registry: ExtensionRegistry): void;
  unregister(registry: ExtensionRegistry): void;
  postParse(container: GlbContainerAssets): void;
}
