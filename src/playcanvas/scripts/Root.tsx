
import * as pc from "playcanvas";
import { FlyCamera } from "./flyCamera";
import { ColorResult } from "react-color";
import { store } from '../../data';
import { LocalDataTrack } from "twilio-video";

interface Root {
  CameraComponent: pc.CameraComponent;
  LightComponent: pc.LightComponent;
}
class Root extends pc.ScriptType {
  public track: LocalDataTrack | null | undefined;
  public initialize() {
    store.subscribe(() => {
      this.changeFloorColor(store.getState().color);
      console.log(this.track);
      this.track = store.getState().channel.channel;
      if(this.track) {
        this.track.on('message', (data: string) => {
          const { type, rgb } = JSON.parse(data);
          console.log(type, rgb);
          
        });
      }
    });
    this.CameraComponent = this.initCamera();
    this.entity.addChild(this.CameraComponent.entity);

    //this.LightComponent = this.initLight();
    //this.entity.addChild(this.LightComponent.entity);

    // const rootEntity = this.initEntities();
    // this.entity.addChild(rootEntity);
  }

  public initEntities(): pc.Entity {
    const entity = new pc.Entity("entity");
    const box = new pc.Entity('cube');
    box.addComponent('model', { type: 'box' });
    entity.addChild(box);
    return entity;
  }

  public initCamera(): pc.CameraComponent {
    const entity = new pc.Entity('camera');
    const component = entity.addComponent('camera') as pc.CameraComponent;
    component.clearColor = new pc.Color(0.12, 0.11, 0.15);
    component.entity.setPosition(0, 10, 15);
    component.entity.setLocalEulerAngles(-35, 0, 0);
    const script = entity.addComponent('script') as pc.ScriptComponent;
    script.create(FlyCamera);
    return component;
  }

  public initLight(): pc.LightComponent {
    const entity = new pc.Entity('light');
    const component = entity.addComponent('light') as pc.LightComponent;
    entity.setEulerAngles(45, 45, 0);
    return component;
  }

  public update(dt: number): void {
  }

  public changeFloorColor(payload:{ r:number, g:number, b:number }) {
    const floor = this.entity.findByName("Floor") as pc.Entity;
    if (floor) {
      const sm = floor.model?.model.meshInstances[0].material as pc.StandardMaterial;
      if (sm) {
        sm.diffuse.r = payload.r;
        sm.diffuse.g = payload.g;
        sm.diffuse.b = payload.b;
        sm.update();
      }
    }
  }

  public broadcastEvent(type: string, arg0: any = null, arg1: any = null) {
    if (type === "onChange") {
      const color = arg0 as ColorResult;
      store.getState().channel.channel?.send(JSON.stringify({
        "type": "setColor",
        "payload": color.rgb
        }));
      this.changeFloorColor({
        r: color.rgb.r / 255,
        g: color.rgb.g / 255,
        b: color.rgb.b / 255,
      });
    }
  }
};

export { Root };