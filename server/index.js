'use strict';

const createAccessToken = require('./token');
const express = require('express');
const WebSocketServer = require('ws').Server;

const path = require('path');
const twilio = require('twilio');
require('dotenv').load();

const app = express();

function createToken(req) {
  const urlParameters = req.query;
  const identity = urlParameters.identity;

  const options = {};
  if (typeof urlParameters.ttl === 'string') {
    options.ttl = parseInt(urlParameters.ttl);
  }

  return createAccessToken(identity, options);
}

function handleAccessTokenRequest(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.set('Content-Type', 'text/plain');
  res.send(createToken(req));
}

app.get('/token', handleAccessTokenRequest);

const PORT = process.env.PORT || 3001;

let server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

const clients = [];
let wss = new WebSocketServer({noServer: true, path: "/connect"});
wss.on('connection', ws => {
  clients.push(ws);
  ws.on('message', message => {
    clients.forEach(client => client.send(message.toString()));
  });
  ws.on('close', message => {
    const idx = clients.indexOf(ws);
    clients.splice(idx, idx);
    clients.forEach(client => {
      client.send(JSON.stringify({ type: "leave", id: idx, value: "" }));
    });
  });
  clients.forEach(client => {
    client.send(JSON.stringify({ type: "enter", id: clients.indexOf(ws), value: "" }));
  });
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request);
  });
});