
import * as pc from "playcanvas";
import { Root } from "./scripts/Root"
import { Character } from "./scripts/character";
import { PlayCanvasGltfLoader } from "./playCanvasGltfLoader"
import { CustomGltfLoader } from "../core/customGltfLoader"
import WebSocketHub from '../ws';

export class PlayCanvasViewer {
  private _app!: pc.Application;
  public get app(): pc.Application {
    return this._app;
  }

  private _gltfLoader?: PlayCanvasGltfLoader;
  public get gltfLoader(): PlayCanvasGltfLoader {
    if (this._gltfLoader == null)
    this._gltfLoader = new PlayCanvasGltfLoader(this.app);
    return this._gltfLoader;
  }

  private _root?: Root;
  public get root(): Root | null {
    if (!this._root)  return null;
    return this._root;
  }
  private wsh: WebSocketHub;
  private _chracters: Map<string, Character>;
  private _isChatActive: boolean;
  private _text!: HTMLInputElement;

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
  constructor() {
    this.wsh = WebSocketHub.getInstance();
    this._chracters = new Map<string, Character>();
    this._isChatActive = false;
  }

  public initialize(canvas: HTMLCanvasElement) {
    this._app = this._createApp(canvas);
    this._app.mouse.on(pc.EVENT_MOUSEUP, this._onMouseUp, this);
    this._app.keyboard.on(pc.EVENT_KEYDOWN, this._onKeyUp, this);
    this._app.assets.loadFromUrl("../../assets/NotoSansKR-Medium/NotoSansKR-Medium.json", "font", (err, asset) => {
      console.log(err);
      if (asset) {
        console.log(asset);
        asset.name = "notosans";
        this._app.assets.add(asset);
      }
    });

    const scriptComponent = this._app.root.addComponent("script") as pc.ScriptComponent;
    this._root = scriptComponent.create(Root, {}) as Root;
    this.app.start();
    if (this.app.xr.supported) {
      setTimeout(() => {
        this.runWebXR();
      }, 100);
    }

    //Get World Information
    this.wsh.setCallback('world', (data: any)=> {
      console.log(data);
    });

    //Create and Register local avatar
    setTimeout(()=>{
      const char = this.createCharacter();
      this.wsh.sendMessage('join', { position: char.getPosition(), color: char.getColor()});
      this.wsh.sendMessage('world', {});
    }, 500);

    // Message handlers
    this.wsh.setCallback('move', (obj: any)=> {
      console.log(obj.id, this._chracters);
      if (this._chracters.has(obj.id+'')) {
        console.log(obj.id);
        this._chracters.get(obj.id+'')?._control?.moveTo(new pc.Vec3(obj.position));
      }
    });

    this.wsh.setCallback('chat', (obj: any)=> {
      console.log(obj.id, this._chracters);
      if (this._chracters.has(obj.id+'')) {
        console.log('chat', obj.id);
        this._chracters.get(obj.id+'')?._control?.chat(obj.msg);
      }
    });
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

  setInputElement(input: HTMLInputElement) {
    this._text = input;
    this._text.style.position = "relative";
    this._text.style.width = "400px";
    this._text.style.top = "-400px";
    this._text.style.left = "100px";
    this._text.hidden = true;
  }

  public runWebXR() {
    if (this.app.xr.isAvailable(pc.XRTYPE_VR)) {
      let entity = this.app.root.findByName('camera') as pc.Entity;
      // start session
      if (entity.camera) {
        entity.camera.startXr(pc.XRTYPE_VR, pc.XRSPACE_LOCALFLOOR, {
          callback: function (err) {
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

  public broadcastEvent(type: string, arg0: any = null, arg1: any = null) {
    this.root?.broadcastEvent(type, arg0, arg1);
  }

  private createCharacter(pos?: pc.Vec3, color?: pc.Color) {
    const ch = new Character();
    ch._id = this.wsh.getID().toString();
    ch.fontAsset = this._app.assets.find('notosans').id;
    this._root?.entity.addChild(ch);
    this._chracters.set(ch._id, ch);
    
    if(pos) {
      ch.setPosition(new pc.Vec3(pos.x, pos.y, pos.z));
    } else {
      ch.setPosition(new pc.Vec3(0, 0, 0));
    }
    if(color) {
      ch.setColor(new pc.Color(color.r, color.g, color.b));
    } else {
      ch.setColor(new pc.Color(Math.random(), Math.random(), Math.random(), 1));
    }
    return ch;
  }
  private _onKeyUp(event: pc.KeyboardEvent) {
    if (event.key == pc.KEY_ENTER) {
        if (this._isChatActive) {
            this._isChatActive = false;
            const s = this._text.value as string;
            // send to server
            this.wsh.sendMessage('chat', {id: this.wsh.getID(), msg: this._text.value});
            this._text.value = "";
            this._text.hidden = true;
            //this.canvas.focus();
            if (this._root?.CameraComponent)
                this._root.CameraComponent.enabled = true;
        }
        else {
            this._isChatActive = true;
            this._text.hidden = false;
            this._text.focus();
            if (this._root?.CameraComponent)
                this._root.CameraComponent.enabled = false;
        }
    }

    if (event.key == pc.KEY_ESCAPE) {
        //this._gltfSceneRoot.enabled = !this._gltfSceneRoot.enabled;
    }
  }
  private _onMouseUp(event: pc.MouseEvent) {
    if (event.button === pc.MOUSEBUTTON_RIGHT) {
        const cm = this._root?.CameraComponent;
        const start = cm?.screenToWorld(event.x, event.y, cm?.nearClip) as pc.Vec3;
        const end = cm?.screenToWorld(event.x, event.y, cm?.farClip) as pc.Vec3;
        let result = new pc.Vec3(0, 0, 0);
        const K = (0 - start.y) / (end.y - start.y);
        const X = K * (end.x - start.x) + start.x;
        const Z = K * (end.z - start.z) + start.z;
        result = new pc.Vec3(X, 0, Z);
        
        this.wsh.sendMessage('move', {id: this.wsh.getID(), position: [result.x, result.y, result.z]});
    }
  }
}
