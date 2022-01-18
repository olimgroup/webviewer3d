
import * as pc from "playcanvas";
import { Root } from "./scripts/Root"
import { PlayCanvasGltfLoader } from "./playCanvasGltfLoader"
import { CustomGltfLoader } from "../core/customGltfLoader"

export class PlayCanvasViewer {

    constructor(public canvas: HTMLCanvasElement) {
        this._app = this._createApp(canvas);
    }

    private _app: pc.Application;
    public get app(): pc.Application {
        return this._app;
    }

    private _gltfLoader?: PlayCanvasGltfLoader;
    public get gltfLoader(): PlayCanvasGltfLoader {
        if (this._gltfLoader == null)
            this._gltfLoader = new PlayCanvasGltfLoader(this.app);
        return this._gltfLoader;
    }

    private _createApp(canvas: HTMLCanvasElement) {
        const app = new pc.Application(canvas, {
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
        app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);
        app.loader.addHandler("customGltfLoader", new CustomGltfLoader);
        window.addEventListener('resize', (event: Event) => {
            this._app.resizeCanvas();
        });
        return app;
    }

    public Initialize() {
        const scriptComponent = this._app.root.addComponent("script") as pc.ScriptComponent;
        scriptComponent.create(Root, {});
        this.app.start();
    }

    public async loadGltf(url: string, fileName?: string) {
        try {
            const gltf = await this.gltfLoader.load(url, fileName);
            if (gltf.scenes.length != 0) {
                this.app.root.addChild(gltf.scenes[gltf.defaultScene]);
            }
        } catch (e) {
            console.debug(e);
            throw e;
        }
    }
}
