
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 9090;

// Almacenar las últimas 100 lecturas en memoria
let readings = [];

// Endpoint para que el Arduino envíe datos
app.get('/api/readings', (req, res) => {
  const { ppm, raw, rs, level } = req.query;

  if (ppm && raw && rs && level) {
    const newReading = {
      ppm: parseFloat(ppm),
      raw: parseInt(raw),
      rs: parseFloat(rs),
      level: level,
      timestamp: new Date(),
    };

    // Añadir la nueva lectura y mantener solo las últimas 100
    readings.unshift(newReading);
    readings = readings.slice(0, 100);

    // Enviar la nueva lectura a todos los clientes WebSocket conectados
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'new_reading', payload: newReading }));
      }
    });

    console.log('Lectura recibida:', newReading);
    res.status(200).send('OK');
  } else {
    res.status(400).send('Faltan parámetros');
  }
});

// Endpoint para obtener el historial de lecturas
app.get('/api/history', (req, res) => {
  res.json(readings);
});

// Manejo de conexiones WebSocket
wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');

  // Enviar el historial actual al nuevo cliente
  ws.send(JSON.stringify({ type: 'history', payload: readings }));

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
