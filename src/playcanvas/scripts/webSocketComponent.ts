import * as pc from "playcanvas";
import { Character } from "./character";

export type sessionDetail = {
  id: string;
  color: pc.Color;
  char?: Character;
}


type MessageType = any;

export interface MessageHandlers {
  [key: string]: (recvMsg: MessageType) => void;
}

export class WebSocketComponent extends pc.ScriptType {
  private webSocket!: WebSocket;
  private sessions!: sessionDetail[];
  private isChatActive!: boolean;
  private self!: sessionDetail;
  private callbacks!: MessageHandlers;

  initialize() {

    this.self = {
      id: Math.random().toString(36).slice(2),
      color: new pc.Color(Math.random(), Math.random(), Math.random(), 1)
    }

    this.callbacks = {
      new_people: this.onNewPeople,
      introduce: this.onIntroduce,
      move_to: this.onMoveTo,
      chat: this.onChat,
    }

    console.log(this.self);
    this.webSocket = new WebSocket("ws://192.168.1.102:3001");
    this.webSocket.onmessage = (event: MessageEvent<any>) => {
      console.log(this.self);
      const recvMsg = JSON.parse(event.data.toString()) as MessageType;
      this.onMessage(recvMsg);
    };
  }

  onMessage(recvMsg: MessageType) {
    console.log(this.self);
    this.callbacks[recvMsg.type as string](recvMsg);
    // switch (msg.type) {
    //   case "new_people":
    //     break;
    //   case "introduce":
    //     break;
    //   case "move_to":
    //     break;
    //   case "chat":
    //     break;
    // }
  }

  onNewPeople(recvMsg: MessageType) {
    console.log(this.self);
    const sendMsg = {
      type: "introduce",
      from: this.self.id,
      to: "broadcast",
      what: {
        pos: [0, 0, 0],
        color: [this.self.color.r, this.self.color.g, this.self.color.b, 1],
      }
    };
    if (this.self.char) {
      const pos = this.self.char.getLocalPosition();
      sendMsg.what.pos = [pos.x, pos.y, pos.z];
    }
    const str = JSON.stringify(sendMsg);
    this.webSocket.send(str);
  }

  onIntroduce(recvMsg: MessageType) {
    const index = this.sessions.findIndex(value => value.id == recvMsg.from);
    if (index === -1) {
      const ch = new Character();
      this.entity.addChild(ch);
      this.sessions.push({
        id: recvMsg.from,
        color: recvMsg.what.color,
        char: ch
      });
      ch.setPosition(new pc.Vec3(recvMsg.what.pos));
      ch.SetColor(new pc.Color(recvMsg.what.color));
      if (recvMsg.from == this.self.id) {
        this.self.char = ch;
      }
    }
  }

  onMoveTo(recvMsg: MessageType) {
    const index = this.sessions.findIndex(value => value.id == recvMsg.from);
    if (index != -1) {
      this.sessions[index].char?._control?.moveTo(new pc.Vec3(recvMsg.what.goal));
    }
  }

  onChat(recvMsg: MessageType) {
    const index = this.sessions.findIndex(value => value.id == recvMsg.from);
    if (index != -1) {
      this.sessions[index].char?._control?.chat(recvMsg.what.str);
    }
  }
}