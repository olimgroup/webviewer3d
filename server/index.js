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
  res.header('Access-Control-Allow-Origin', '*');
  res.set('Content-Type', 'text/plain');
  res.send(createToken(req));
}

app.get('/token', handleAccessTokenRequest);

const PORT = process.env.PORT || 3001;

let server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

const clients = [];
let wss = new WebSocketServer({noServer: true, path: '/connect'});
wss.on('connection', ws => {
  const id = genID(1, 10000);
  clients.push({
    id: id,
    ws: ws,
    avatar: {}
  });

  ws.send(JSON.stringify({ type: 'handshake', id: id, value: '' }));
  ws.on('message', message => {
    const obj = JSON.parse(message);
    if(obj.type == 'world') {
      const avatars = clients.map(function(client) {
        return client.avatar;
      });
      ws.send(JSON.stringify({ type: 'world', id: 0, value: avatars}));
    } else if (obj.type == 'join') {
      const target = clients.find(client => { return client.id == obj.id});
      target.avatar = obj.value;
      clients.forEach((client)=>{
        client.ws.send(JSON.stringify({ type: 'join', id: target.id, value: target.avatar}));
      });
    } else {
      clients.forEach((client)=>{
        client.ws.send(message.toString());
      });
    }
  });
  ws.on('close', message => {
    const obj = JSON.parse(message);
    const target = clients.find(client => { client.id == obj.id});
    if(!target) return;
    clients.forEach((client) => {
      client.ws.send(JSON.stringify({ type: 'leave', id: target.id, value: '' }));
    });
  });
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request);
  });
});

function genID(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}