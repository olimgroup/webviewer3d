import * as pc from "@animech-public/playcanvas";


export class CharacterComponent extends pc.ScriptType {
  _goal: pc.Vec3;
  _speed: number;
  _moveTo: boolean;
  _acc: number;
  public constructor(args: { app: pc.Application; entity: pc.Entity }) {
    super(args);
    this._goal = new pc.Vec3(0, 0, 0);
    this._speed = 5;
    this._moveTo = false;
    this._acc = 0;
  }

  update(dt: number) {

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
    this.entity.setPosition(result);

    this.entity.lookAt(this._goal);
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

  public _material!: pc.StandardMaterial;

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
    head_model.material = this._material;


    const body = new pc.Entity('body');
    const body_model = body.addComponent('model', { type: 'cone' }) as pc.ModelComponent;
    this.addChild(body);
    body_model.layers = [1, 2, 3];
    body.setLocalPosition(0, 0.4, 0);
    body.setLocalScale(0.3, 0.8, 0.1);
    body.setLocalEulerAngles(180, 0, 0);
    body_model.material = this._material;
  }

  public SetColor(color: pc.Color) {
    this._material.diffuse.r = color.r;
    this._material.diffuse.g = color.g;
    this._material.diffuse.b = color.b;
    this._material.diffuse.a = color.a;
    this._material.update();
  }
}