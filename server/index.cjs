
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
  console.log(`[${new Date().toLocaleTimeString()}] Petición recibida con los parámetros:`, req.query);

  const { ppm, raw, rs, level } = req.query;
  const errors = [];

  const parsedPPM = parseFloat(ppm);
  const parsedRaw = parseInt(raw, 10);
  const parsedRS = parseFloat(rs);

  // Validación individual y robusta de cada campo
  if (isNaN(parsedPPM)) errors.push('ppm');
  if (isNaN(parsedRaw)) errors.push('raw');
  if (isNaN(parsedRS)) errors.push('rs');
  if (!level || typeof level !== 'string' || level.trim() === '') errors.push('level');

  if (errors.length === 0) {
    const newReading = {
      ppm: parsedPPM,
      raw: parsedRaw,
      rs: parsedRS,
      level: level,
      timestamp: new Date(),
    };

    readings.unshift(newReading);
    if (readings.length > MAX_READINGS) readings.pop();

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'new_reading', payload: newReading }));
      }
    });
    
    console.log('  -> Datos VÁLIDOS. Lectura procesada.');
    res.status(200).send('Reading received successfully');
  } else {
    const errorMessage = `Los siguientes campos son inválidos o están ausentes: ${errors.join(', ')}`;
    console.error(`  -> Error 400: ${errorMessage}`);
    res.status(400).send(errorMessage);
  }
});

app.get('/api/history', (req, res) => {
  res.json(readings);
});

wss.on('connection', ws => {
  console.log('[WebSocket] Cliente del Dashboard conectado.');
  ws.send(JSON.stringify({ type: 'history', payload: readings }));
  ws.on('close', () => console.log('[WebSocket] Cliente del Dashboard desconectado.'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor robusto de API y WebSocket corriendo en http://0.0.0.0:${PORT}`);
  console.log('Esperando peticiones del sensor...');
});
