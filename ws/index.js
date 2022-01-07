const webSocket = require('ws');
const wss = new webSocket.Server({ port: 3001 });
const clients = [];
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('message', message => {
    clients.forEach(client => client.send(message.toString()));
  });
  ws.on('close', message => {
    const idx = clients.indexOf(ws);
    clients.splice(idx, idx);
  });
  clients.forEach(client => {
    client.send(JSON.stringify({ type: "new people" }));
  });
});