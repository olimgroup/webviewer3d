
import * as pc from "@animech-public/playcanvas";
import { FlyCamera } from "./FlyCamera"
class GLTFRoot extends pc.ScriptType {
    _box?: pc.Entity;
    _camera?: pc.Entity;
    _flyCamera?: FlyCamera;
    _light?: pc.Entity;

    public constructor(args: { app: pc.Application; entity: pc.Entity }) {
        super(args);
    }

    public load() {

        this._camera = new pc.Entity("camera");
        this._camera.addComponent("camera", { clearColor: new pc.Color(0.12, 0.11, 0.15) });
        this._camera.addComponent("script");
        this._camera.setPosition(0, 5, 5);
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

        this._box = new pc.Entity('cube');

        // mc.castShadows = true;
        // mc.layers = [1, 2, 3];

        // this.entity.addChild(this._box);
    }


    public update(dt: number) {
        this._box?.rotate(dt * 10, dt * 20, dt * 30);
    }
}

export { GLTFRoot };