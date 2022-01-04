
import * as pc from "@animech-public/playcanvas";
import {FlyCamera} from "./FlyCamera"
class GLTFRoot extends pc.ScriptType {    
    _box? : pc.Entity;
    _camera? : pc.Entity;
    _light?: pc.Entity;

    public constructor(args: { app: pc.Application; entity: pc.Entity }) {
        super(args);
    }

    public load() {

        this._camera = new pc.Entity("camera");
        this._camera.addComponent("camera", { clearColor: new pc.Color(0.12, 0.11, 0.15) });
        this._camera.addComponent("script");
        this._camera.setPosition(-1, 5, 5);
        this._camera.setLocalEulerAngles(-45, 0, 0);
        const script = this._camera.script?.create(FlyCamera, { enabled: true}) as FlyCamera;
        script.speed = 2;
        script.fastSpeed = 5;
        script.mouseSensitivity = 10;
        this.entity.addChild(this._camera);
        
        
        // this._camera.setLocalPosition(-3, 1.5, 2);
        // this._light = new pc.Entity('light');
        // const lc = this._light.addComponent('light') as pc.LightComponent;
        // lc.layers = [1, 2, 3];
        // //lc.layers.push(999);
        // this._light.setEulerAngles(0, 0, 0);
        // this.entity.addChild(this._light);

        // this._box = new pc.Entity('cube');
        
        // const mc = this._box.addComponent('model', { type: 'box' }) as pc.ModelComponent;
        // mc.castShadows = true;
        // mc.layers = [1, 2, 3];
        
        // this.entity.addChild(this._box);
    }

    
    public update(dt:number) {
        this._box?.rotate(dt * 10, dt * 20, dt * 30);
    }
}

export { GLTFRoot };