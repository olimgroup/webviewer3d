
import * as pc from "playcanvas";
import { FlyCamera } from "./flyCamera";
import { ColorResult } from "react-color";

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
    }

    public broadcastEvent(type: string, arg0: any = null, arg1: any = null) {
        if (type === "onChange") {
            const floor = this.entity.findByName("Floor") as pc.Entity;
            const color = arg0 as ColorResult;
            if (floor && color) {
                const redValue = color.rgb.r / 255;
                const greenValue = color.rgb.g / 255;
                const blueValue = color.rgb.b / 255;
                const sm = floor.model?.model.meshInstances[0].material as pc.StandardMaterial;
                if (sm) {
                    sm.diffuse.r = redValue;
                    sm.diffuse.g = greenValue;
                    sm.diffuse.b = blueValue;
                    sm.update();
                }
            }
        }
    }
};

export { Root };