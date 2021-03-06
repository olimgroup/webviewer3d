
import * as pc from "@animech-public/playcanvas";
import { FlyCamera } from "./FlyCamera"
class GLTFRoot extends pc.ScriptType {
    public _box?: pc.Entity;
    public _camera?: pc.Entity;
    public _flyCamera?: FlyCamera;
    public _light?: pc.Entity;

    public constructor(args: { app: pc.Application; entity: pc.Entity }) {
        super(args);
    }

    public load() {

        this._camera = new pc.Entity("camera");
        this._camera.addComponent("camera", { clearColor: new pc.Color(0.12, 0.11, 0.15) });
        this._camera.addComponent("script");
        this._camera.setPosition(0, 15, 0);
        this._flyCamera = this._camera.script?.create(FlyCamera, { enabled: true }) as FlyCamera;
        this._flyCamera.speed = 2;
        this._flyCamera.fastSpeed = 5;
        this._flyCamera.mouseSensitivity = 10;
        this.entity.addChild(this._camera);

        this._light = new pc.Entity('light');
        this._light.setEulerAngles(0, 0, 0);
        this.entity.addChild(this._light);
        const lc = this._light.addComponent('light') as pc.LightComponent;
        lc.layers = [1, 2, 3];
    }


    public update(dt: number) {
        this._box?.rotate(dt * 10, dt * 20, dt * 30);
    }
}

export { GLTFRoot };