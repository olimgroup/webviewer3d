
import * as pc from "playcanvas";
import { Root } from "./scripts/Root"
import { PlayCanvasGltfLoader } from "./playCanvasGltfLoader"
import { CustomGltfLoader } from "../core/customGltfLoader"
import { SketchPicker } from "react-color";

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
        if (this.app.xr.supported) {
            setTimeout(() => {
                this.runWebXR();
            }, 100);
        }

        const jj = document.getElementsByClassName("sketch-picker");
        if (jj) {
            const kk = jj[0] as HTMLDivElement;
            kk.style.position = "relative";
            kk.style.width = "250px";
            kk.style.top = "-430px";
            kk.style.left = "20px";
        }
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
    public runWebXR() {
        if (this.app.xr.isAvailable(pc.XRTYPE_VR)) {
            let entity = this.app.root.findByName('camera') as pc.Entity;
            // start session
            if (entity.camera) {
                entity.camera.startXr(pc.XRTYPE_VR, pc.XRSPACE_LOCALFLOOR, {
                    callback: function(err) {
                        if (err) {
                            throw err;
                        }
                    }
                });
            }
        } else {
            throw Error("WebXR not available");
        }
    }
}
