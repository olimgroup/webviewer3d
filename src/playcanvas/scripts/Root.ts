
import * as pc from "playcanvas";

class Root extends pc.ScriptType {
    private CameraComponent!: pc.CameraComponent;
    private LightComponent!: pc.LightComponent;

    public initialize() {
        this.CameraComponent = this.init_camera();
        this.entity.addChild(this.CameraComponent.entity);

        this.LightComponent = this.init_light();
        this.entity.addChild(this.LightComponent.entity);

        const rootEntity = this.init_entities();
        this.entity.addChild(rootEntity);
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
        component.entity.setPosition(0, 5, 10);
        component.entity.setLocalEulerAngles(-35, 0, 0);
        return component;
    }

    public init_light(): pc.LightComponent {
        const entity = new pc.Entity('light');
        const component = entity.addComponent('light') as pc.LightComponent;
        entity.setEulerAngles(45, 45, 0);
        return component;
    }
};

export { Root };