
import * as pc from "playcanvas";

const gltfRootScriptName = "NodeLightMap";

class GLTFRoot extends pc.ScriptType {    
    _box? : pc.Entity;
    _camera? : pc.Entity;
    public load() {

        this._camera = new pc.Entity('camera');
        this._camera.addComponent('camera', { clearColor: new pc.Color(0.12, 0.11, 0.15) }) as pc.CameraComponent;
        this._camera.setPosition(0, 10, 10);
        this._camera.setLocalEulerAngles(-45, 0, 0);
        this.entity.addChild(this._camera);
        
        const light = new pc.Entity('light');
        light.addComponent('light');
        light.setEulerAngles(0, 0, 0);
        this.entity.addChild(light);

        this._box = new pc.Entity('cube');
        this._box.addComponent('model', { type: 'box' });
        const sm = this._box.model?.material as pc.StandardMaterial;
        sm.diffuse.g = 0.0;
        sm.diffuse.b = 0.0;
        sm.update();
        
        this.entity.addChild(this._box);
    }

    
    public update(dt:number) {
        this._box?.rotate(dt * 10, dt * 20, dt * 30);
        //this._camera?.rotate(0, 0, 0);
    }
};

export { gltfRootScriptName, GLTFRoot };