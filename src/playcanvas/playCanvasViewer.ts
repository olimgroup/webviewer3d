
import * as pc from "@animech-public/playcanvas";
import { GLTFRoot } from "./scripts/GltfRoot"
import { PlayCanvasGltfLoader, GltfData, GltfSceneData, } from "./PlayCanvasGltfLoader"

export class PlayCanvasViewer implements IViewer {
    private _loader: PlayCanvasGltfLoader;
    private _rootScript?: pc.ScriptComponent;
    private _gltfRoot?: GLTFRoot;
    private _app: pc.Application;
    private _initiated = false;
    private _gltfLoaded = false;
    private _gltf?: GltfData;
    private _activeGltfScene?: GltfSceneData;

    constructor(public canvas: HTMLCanvasElement) {
        this._app = this._createApp(canvas);
        this._loader = new PlayCanvasGltfLoader(this._app);
    }
    public get rootScript() {
        return this._rootScript;
    }
    public get gltfRoot() {
        return this._gltfRoot;
    }
    public get app(): pc.Application {
        return this._app;
    }
    public get initiated(): boolean {
        return !!this._app.graphicsDevice && this._initiated;
    }
    public get gltfLoaded() {
        return this._gltfLoaded;
    }
    private _createApp(canvas: HTMLCanvasElement) {
        const app = new pc.Application(canvas, {
            assetPrefix: "",
            mouse: new pc.Mouse(document.body),
            keyboard: new pc.Keyboard(window),
            graphicsDeviceOptions: {
                preserveDrawingBuffer: false,
                antialias: true,
                alpha: true,
                preferWebGl2: true,
                use3dPhysics: false,
            }
        });
        window.addEventListener('resize', (event: Event) => {
            this._app.resizeCanvas();
        });
        return app;
    }
    public async Initialize() {
        this._app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        this._app.setCanvasResolution(pc.RESOLUTION_AUTO);

        this._rootScript = this._app.root.addComponent("script") as pc.ScriptComponent;

        this._gltfRoot = this._rootScript.create(GLTFRoot, {}) as GLTFRoot;        
        this._gltfRoot.load();
        this.loadGltf("../../assets/ZE152_01_A22/ZE152_01_A2.gltf", "ZE152_01_A2.gltf");
        this.loadGltf("../../assets/couch/couch.gltf", "couch.gltf");
        this._app.start();
    }

    public destroyGltf() {
 
        this._gltfLoaded = false;

        if (this._gltfRoot) {
            this._app.root.removeChild(this._gltfRoot.entity.root);
            this._activeGltfScene = undefined;
        }

        if (this._gltf) {
            this._loader.unload(this._gltf);
            this._gltf = undefined;
        }
    }

    private async _setSceneHierarchy(gltfScene: GltfSceneData) {

        // if (this._activeGltfScene) {
        //     this._app.root.removeChild(this._activeGltfScene.root);
        // }
        // this._activeGltfScene = gltfScene;
        this._gltfRoot?.entity.addChild(gltfScene.root);
    }
    public async loadGltf(url: string, fileName?: string) {
        //this.destroyGltf();
        try {
            const loader = new PlayCanvasGltfLoader(this._app);
            this._gltf = await loader.load(url, fileName);
            await this._setSceneHierarchy(this._gltf.scenes[this._gltf.defaultScene]);
            this._gltfLoaded = true;
        } catch (e) {
            this._gltfLoaded = true;
            throw e;
        }
    }
}
