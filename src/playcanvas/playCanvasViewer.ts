
import * as pc from "@animech-public/playcanvas";
import { GLTFRoot } from "./scripts/gltfRoot"
import { PlayCanvasGltfLoader, GltfData, GltfSceneData, } from "./playCanvasGltfLoader"
import { Character } from "./scripts/Character";
export type PreventableEvent<TEvent extends Event = Event> = TEvent & {
    prevent: boolean;
};
//type MouseDownEvent = { event: PreventableEvent; button: number };

interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    //forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
    readonly size: number;
}


export class PlayCanvasViewer implements IViewer {
    private _loader: PlayCanvasGltfLoader;
    private _rootScript?: pc.ScriptComponent;
    private _gltfRoot?: GLTFRoot;
    private _app: pc.Application;
    private _initiated = false;
    private _gltfLoaded = false;
    private _gltf?: GltfData;

    private _WebSocket?: WebSocket;
    private _idd: string;
    private _color: pc.Color;
    private _chracters: Map<string, Character>;

    private _text!: HTMLInputElement;

    private _div!: HTMLDivElement;
    private _isChatActive: boolean;

    constructor(public rootDiv: HTMLDivElement, public canvas: HTMLCanvasElement) {
        this._div = rootDiv;
        this._idd = Math.random().toString(36).slice(2);
        this._color = new pc.Color(Math.random(), Math.random(), Math.random(), 1);
        this._app = this._createApp(canvas);
        this._loader = new PlayCanvasGltfLoader(this._app);

        this._app.mouse.on(pc.EVENT_MOUSEUP, this._onMouseUp, this);
        this._app.keyboard.on(pc.EVENT_KEYDOWN, this._onKeyUp, this);

        this._chracters = new Map<string, Character>();

        this.app.assets.loadFromUrl("../../assets/NotoSansKR-Medium/NotoSansKR-Medium.json", "font", (err, asset) => {
            if (asset) {
                asset.name = "notosans";
                this.app.assets.add(asset);
                //const font = asset.resource as pc.Font;
                //console.log(asset.id);
            }
        });

        this._isChatActive = false;

    }

    setInputElement(input: HTMLInputElement) {
        this._text = input;
        this._text.style.position = "relative";
        this._text.style.width = "400px";
        this._text.style.top = "-400px";
        this._text.style.left = "100px";
        this._text.hidden = true;
    }

    private OnMessage(obj: any) {

        if (obj.type == "new people") {
            const msg = {
                type: "introduce",
                id: this._idd,
                status: {
                    position: [0, 0, 0],
                    color: [this._color.r, this._color.g, this._color.b, 1],
                }
            };
            let pos = new pc.Vec3();
            if (this._chracters.has(this._idd)) {
                const ch = this._chracters.get(this._idd);
                if (ch) {
                    pos = new pc.Vec3(ch.getLocalPosition().x, ch.getLocalPosition().y, ch.getLocalPosition().z)
                }
            }
            msg.status.position[0] = pos.x;
            msg.status.position[1] = pos.y;
            msg.status.position[2] = pos.z;

            const str = JSON.stringify(msg);
            this._WebSocket?.send(str);
        }

        if (obj.type == "introduce") {
            if (this._chracters.has(obj.id)) {

            }
            else {
                const ch = new Character();
                ch._id = obj.id;
                this.gltfRoot?.entity.addChild(ch);
                this._chracters.set(obj.id, ch);
                ch.setPosition(new pc.Vec3(obj.status.position));
                ch.SetColor(new pc.Color(obj.status.color));
            }
        }

        if (obj.type == "move to") {
            if (this._chracters.has(obj.id)) {
                this._chracters.get(obj.id)?._control?.moveTo(new pc.Vec3(obj.position));
            }
        }

        if (obj.type == "chat") {
            if (this._chracters.has(obj.id)) {
                this._chracters.get(obj.id)?._control?.chat(obj.msg);
            }
        }
    }
    private _onKeyUp(event: pc.KeyboardEvent) {
        if (event.key == pc.KEY_ENTER) {
            if (this._isChatActive) {
                this._isChatActive = false;
                const s = this._text.value as string;
                const msg = {
                    type: "chat",
                    id: this._idd,
                    msg: s
                }
                const str = JSON.stringify(msg);
                this._WebSocket?.send(str);
                this._text.value = "";
                this._text.hidden = true;
                this.canvas.focus();
                if (this._gltfRoot?._flyCamera)
                    this._gltfRoot._flyCamera.isActive = true;
            }
            else {
                this._isChatActive = true;
                this._text.hidden = false;
                this._text.focus();
                if (this._gltfRoot?._flyCamera)
                    this._gltfRoot._flyCamera.isActive = false;
            }
        }
    }
    private _onMouseUp(event: pc.MouseEvent) {
        if (event.button === pc.MOUSEBUTTON_RIGHT) {
            const cm = this._gltfRoot?._camera?.camera;
            const start = cm?.screenToWorld(event.x, event.y, cm?.nearClip) as pc.Vec3;
            const end = cm?.screenToWorld(event.x, event.y, cm?.farClip) as pc.Vec3;
            let Result = new pc.Vec3(0, 0, 0);
            const K = (0 - start.y) / (end.y - start.y);
            const X = K * (end.x - start.x) + start.x;
            const Z = K * (end.z - start.z) + start.z;
            Result = new pc.Vec3(X, 0, Z);
            const msg = {
                type: "move to",
                id: this._idd,
                position: [Result.x, Result.y, Result.z]
            }
            const str = JSON.stringify(msg);
            this._WebSocket?.send(str);
        }
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
        window.addEventListener('resize', () => {
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
        this._app.start();



        this._WebSocket = new WebSocket("ws://192.168.1.102:3001");
        this._WebSocket.onmessage = (event) => {
            const obj = JSON.parse(event.data.toString());
            this.OnMessage(obj);
        };

        this.loadGltf("../../assets/ZE152_01_A22/ZE152_01_A2.gltf", "ZE152_01_A2.gltf");
    }

    public destroyGltf() {

        this._gltfLoaded = false;

        if (this._gltfRoot) {
            this._app.root.removeChild(this._gltfRoot.entity.root);
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
