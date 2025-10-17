
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 9090;

// Cambiamos a una única lista de lecturas
let readings = [];
const MAX_READINGS = 200; // Mantenemos un historial de las últimas 200 lecturas

// Endpoint para que el dispositivo envíe datos (ahora sin sensorId)
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

    // Añadimos la nueva lectura al principio de la lista
    readings.unshift(newReading);

    // Limitamos el tamaño del historial para no consumir memoria infinita
    if (readings.length > MAX_READINGS) {
      readings.pop();
    }

    // Enviamos la nueva lectura a todos los clientes conectados al dashboard
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'new_reading', payload: newReading }));
      }
    });

    res.status(200).send('Reading received');
  } else {
    res.status(400).send('Invalid reading data. Asegúrate de enviar ppm, raw, rs y level.');
  }
});

// Endpoint para obtener todo el historial (simplificado)
app.get('/api/history', (req, res) => {
  res.json(readings);
});

// Lógica de conexión del WebSocket
wss.on('connection', ws => {
  console.log('Cliente del Dashboard conectado.');

  // Al conectarse un nuevo cliente, se le envía el historial completo actual
  ws.send(JSON.stringify({ type: 'history', payload: readings }));

  ws.on('close', () => {
    console.log('Cliente del Dashboard desconectado.');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de WebSocket y API corriendo en http://0.0.0.0:${PORT}`);
});
