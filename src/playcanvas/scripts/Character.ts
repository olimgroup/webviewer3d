import * as pc from "@animech-public/playcanvas";
import { GLTFRoot } from "./GltfRoot";


export class CharacterComponent extends pc.ScriptType {
  _goal: pc.Vec3;
  _speed: number;
  _moveTo: boolean;
  _acc: number;
  _screen?: pc.Entity;
  _chatMsgTime: number;
  public constructor(args: { app: pc.Application; entity: pc.Entity }) {
    super(args);
    this._goal = new pc.Vec3(0, 0, 0);
    this._speed = 3;
    this._moveTo = false;
    this._acc = 0;
    this._chatMsgTime = 0;
  }

  update(dt: number) {
    this._chatMsgTime -= dt;

    const ch = this.entity as Character;
    const text = ch._text as pc.ElementComponent;
    text.enabled = this._chatMsgTime > 0;

    if (this._screen) {
      const camera = this.app.root.findComponent('camera') as pc.CameraComponent;
      this._screen.setRotation(camera.entity.getRotation());
    }

    if (this._moveTo != true) {
      this._acc += dt * 2;
      const sin = Math.sin(this._acc) * 0.1;
      const cur = this.entity.getPosition();
      cur.y = sin;
      this.entity.setPosition(cur);
      return;
    }

    const from = this.entity.getPosition();
    const to = this._goal.clone();
    const diff = to.sub(from);
    if (diff.length() <= 0.05) {
      this._moveTo = false;
      this._acc = 0;
      return;
    }
    const nomal = diff.normalize();
    const result = from.add(nomal.scale(dt).scale(this._speed));
    if (result.distance(this._goal) <= Number.EPSILON)
      result.copy(this._goal);
    this.entity.setPosition(result);
    //this.entity.lookAt(this._goal);
  }

  chat(msg: string) {
    const ch = this.entity as Character;
    const text = ch._text as pc.ElementComponent;
    text.text = msg;
    this._chatMsgTime = 4;
  }

  moveTo(target: pc.Vec3) {
    this._goal = target;
    this._moveTo = true;
  }
}

export class Character extends pc.Entity {
  public _id?: string;
  public _script?: pc.ScriptComponent;
  public _model?: pc.ModelComponent;
  public _control?: CharacterComponent;

  public _head?: pc.ModelComponent;
  public _body?: pc.ModelComponent;
  public _color?: pc.Color;
  public textAddress?: pc.Entity;

  public _material!: pc.StandardMaterial;

  public _screen?: pc.Entity;
  public _screenComponent?: pc.ScreenComponent;

  public _text?: pc.ElementComponent;


  public constructor() {
    super();

    this._script = this.addComponent('script') as pc.ScriptComponent;
    //this._model = this.addComponent('model', { type: 'capsule' }) as pc.ModelComponent;

    this._control = this._script.create(CharacterComponent, {});

    const head = new pc.Entity('head');
    const head_model = head.addComponent('model', { type: 'sphere' }) as pc.ModelComponent;
    this.addChild(head);
    head_model.layers = [1, 2, 3];
    head.setLocalPosition(0, 0.9, 0);
    head.setLocalScale(0.2, 0.2, 0.2);
    const m = head_model.material as pc.StandardMaterial;
    this._material = m.clone();
    this._material.twoSidedLighting = true;
    head_model.material = this._material;


    const body = new pc.Entity('body');
    const body_model = body.addComponent('model', { type: 'cone' }) as pc.ModelComponent;
    this.addChild(body);
    body_model.layers = [1, 2, 3];
    body.setLocalPosition(0, 0.4, 0);
    body.setLocalScale(0.3, 0.8, 0.3);
    body.setLocalEulerAngles(180, 0, 0);
    body_model.material = this._material;

    this._screen = new pc.Entity();
    this._control._screen = this._screen;
    this._screen.setLocalScale(0.01, 0.01, 0.01);
    this._screen.setPosition(0, 1.0, 0); // place UI slightly above the ground
    this._screen.setLocalRotation(new pc.Quat().setFromEulerAngles(0, 0, 0));
    this._screenComponent = this._screen.addComponent("screen", {
      referenceResolution: new pc.Vec2(1280, 720),
      screenSpace: false
    }) as pc.ScreenComponent;
    this.addChild(this._screen);

    // Text
    const text = new pc.Entity();
    text.setLocalPosition(0, 25, 0);
    this._text = text.addComponent("element", {
      pivot: new pc.Vec2(0.5, 0.5),
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      fontAsset: -1,
      fontSize: 18,
      text: this._id,
      width: 200,
      height: 100,
      autoWidth: true,
      autoHeight: true,
      wrapLines: true,
      enableMarkup: true,
      type: pc.ELEMENTTYPE_TEXT
    }) as pc.ElementComponent;

    this._screen.addChild(text);
  }

  public SetColor(color: pc.Color) {
    this._material.diffuse.r = color.r;
    this._material.diffuse.g = color.g;
    this._material.diffuse.b = color.b;
    this._material.diffuse.a = color.a;
    this._material.update();
  }
}