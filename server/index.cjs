
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 9090;

let readings = [];
const MAX_READINGS = 200;

app.get('/api/readings', (req, res) => {
  // Logs para depuración
  console.log(`[${new Date().toLocaleTimeString()}] Petición recibida en /api/readings`);
  console.log('  -> Query Params:', req.query);

  const { ppm, raw, rs, level } = req.query;

  if (ppm && raw && rs && level) {
    const newReading = {
      ppm: parseFloat(ppm),
      raw: parseInt(raw),
      rs: parseFloat(rs),
      level: level,
      timestamp: new Date(),
    };

    readings.unshift(newReading);
    if (readings.length > MAX_READINGS) {
      readings.pop();
    }

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'new_reading', payload: newReading }));
      }
    });
    
    console.log('  -> Datos VÁLIDOS. Lectura procesada y enviada al dashboard.');
    res.status(200).send('Reading received');
  } else {
    console.log('  -> Error: Datos INVÁLIDOS o incompletos.');
    res.status(400).send('Invalid reading data. Asegúrate de enviar ppm, raw, rs y level.');
  }
});

app.get('/api/history', (req, res) => {
  res.json(readings);
});

wss.on('connection', ws => {
  console.log('[WebSocket] Cliente del Dashboard conectado.');
  ws.send(JSON.stringify({ type: 'history', payload: readings }));

  ws.on('close', () => {
    console.log('[WebSocket] Cliente del Dashboard desconectado.');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de WebSocket y API corriendo en http://0.0.0.0:${PORT}`);
  console.log('------------------------------------------------------------');
  console.log('Esperando peticiones del sensor en /api/readings...');
  console.log('------------------------------------------------------------');
});
