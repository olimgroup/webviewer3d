
import * as pc from "playcanvas";
import { GLTFRoot, gltfRootScriptName } from "./scripts/gltfRoot"

export class PlayCanvasViewer implements IViewer {

    constructor(public canvas: HTMLCanvasElement) {
        this._app = this._createApp(canvas);
    }

    private _app: pc.Application;
    public get app(): pc.Application {
        return this._app;
    }

    private _initiated = false;
    public get initiated(): boolean {
        return !!this._app.graphicsDevice && this._initiated;
    }

    private _createApp(canvas: HTMLCanvasElement) {
        const app = new pc.Application(canvas, {
            assetPrefix: "viewer/playcanvas/",
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
        window.addEventListener('resize', (event : Event) => {
            this._app.resizeCanvas();
        });
        return app;
    }

    public Initialize() {
        this._app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        this._app.setCanvasResolution(pc.RESOLUTION_AUTO);

        const scriptComponent = this._app.root.addComponent("script") as pc.ScriptComponent;
        const gltfRoot = scriptComponent.create(GLTFRoot, {}) as GLTFRoot;
        gltfRoot.load();
        
        this._app.start();
    }
}
