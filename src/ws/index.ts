
export default class WebSocketHub {
  private static instance: WebSocketHub;
  public static getInstance () { return this.instance || (this.instance = new this()); }

  private _ws: WebSocket;
  private callbacks: Map<string, Function>;
    
  constructor() {
    console.log("[DEBUG] WebSocketHub created", process.env.REACT_APP_WEBSOCKET_URL);
    this.callbacks = new Map<string, Function>();
    this._ws = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL!);
    this._ws.onmessage = (event) => {
      console.log(event);
      const obj = JSON.parse(event.data.toString());
      const callback = this.callbacks.get(obj.type);
      if (callback) callback(obj.value);
    };
    this._ws.onclose = (event) => {
      console.log(event);
    }
    this._ws.onerror = (event) => {
      console.log(event);
    }
  }

  public sendMessage(type: string, value: object) {
    console.log(this._ws);
    const msg = { type: type, value: value};
    this._ws.send(JSON.stringify(msg));
  }

  public setCallback(type: string, cb: Function) {
    this.callbacks.set(type, cb);
  }

}