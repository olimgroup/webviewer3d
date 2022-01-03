
import * as pc from "@animech-public/playcanvas";

class GLTFRoot extends pc.ScriptType {    
    _box? : pc.Entity;
    _camera? : pc.Entity;
    _light?: pc.Entity;

    public constructor(args: { app: pc.Application; entity: pc.Entity }) {
        super(args);
    }

    public load() {

        this._camera = new pc.Entity('camera');
        this._camera.addComponent('camera', { clearColor: new pc.Color(0.12, 0.11, 0.15) }) as pc.CameraComponent;
        this._camera.setPosition(0, 10, 10);
        this._camera.setLocalEulerAngles(-45, 0, 0);
        this.entity.addChild(this._camera);
        
        this._light = new pc.Entity('light');
        this._light.addComponent('light');
        this._light.setEulerAngles(0, 0, 0);
        this.entity.addChild(this._light);

        this._box = new pc.Entity('cube');
        this._box.addComponent('model', { type: 'box' });
        
        this.entity.addChild(this._box);
    }

    
    public update(dt:number) {
        this._box?.rotate(dt * 10, dt * 20, dt * 30);
    }
}

export { GLTFRoot };