
export default class WebSocketHub {
  private static instance: WebSocketHub;
  public static getInstance () { return this.instance || (this.instance = new this()); }

  private ws: WebSocket;
  private callbacks: Map<string, Function>;
  private id: number;
    
  constructor() {
    this.callbacks = new Map<string, Function>();
    this.id = -1;
    this.ws = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL!);
    this.ws.onmessage = (event) => {
      const obj = JSON.parse(event.data.toString());
      if(obj.type == "handshake") {
        console.log("handshake", obj.id);
        this.id = obj.id;
        return;
      }
      const callback = this.callbacks.get(obj.type);
      if (callback) callback(obj.value);
    };
    this.ws.onclose = (event) => {
      console.log(event);
    }
    this.ws.onerror = (event) => {
      console.log(event);
    }
  }

  public sendMessage(type: string, value: object) {
    const msg = { type: type, id: this.id, value: value};
    this.ws.send(JSON.stringify(msg));
  }

  public setCallback(type: string, cb: Function) {
    this.callbacks.set(type, cb);
  }

  public getID() {
     return this.id;
  }

}