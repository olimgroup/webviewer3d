
import * as pc from "playcanvas";
import { SketchPicker } from "react-color";
import { FlyCamera } from "./flyCamera";

interface Root {
    CameraComponent: pc.CameraComponent;
    LightComponent: pc.LightComponent;
}
class Root extends pc.ScriptType {
    public initialize() {
        this.CameraComponent = this.init_camera();
        this.entity.addChild(this.CameraComponent.entity);

        //this.LightComponent = this.init_light();
        //this.entity.addChild(this.LightComponent.entity);

        // const rootEntity = this.init_entities();
        // this.entity.addChild(rootEntity);


    }

    public init_entities(): pc.Entity {
        const entity = new pc.Entity("entity");
        const box = new pc.Entity('cube');
        box.addComponent('model', { type: 'box' });
        entity.addChild(box);
        return entity;
    }

    public init_camera(): pc.CameraComponent {
        const entity = new pc.Entity('camera');
        const component = entity.addComponent('camera') as pc.CameraComponent;
        component.clearColor = new pc.Color(0.12, 0.11, 0.15);
        component.entity.setPosition(0, 10, 15);
        component.entity.setLocalEulerAngles(-35, 0, 0);
        const script = entity.addComponent('script') as pc.ScriptComponent;
        //script.create(FlyCamera);
        return component;
    }

    public init_light(): pc.LightComponent {
        const entity = new pc.Entity('light');
        const component = entity.addComponent('light') as pc.LightComponent;
        entity.setEulerAngles(45, 45, 0);
        return component;
    }

    public update(dt: number): void {

        const red = document.getElementById("rc-editable-input-4") as HTMLInputElement;
        const green = document.getElementById("rc-editable-input-6") as HTMLInputElement;
        const blue = document.getElementById("rc-editable-input-8") as HTMLInputElement;
        const floor = this.entity.findByName("Floor") as pc.Entity;
        if (floor && red && green && blue) {
            const redValue = parseFloat(red.value) / 255;
            const greenValue = parseFloat(green.value) / 255;
            const blueValue = parseFloat(blue.value) / 255;
            const sm = floor.model?.model.meshInstances[0].material as pc.StandardMaterial;
            if (sm) {
                sm.diffuse.r = redValue;
                sm.diffuse.g = greenValue;
                sm.diffuse.b = blueValue;
                sm.update();
            }
        }
    }
};

export { Root };