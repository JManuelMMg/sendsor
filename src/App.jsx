
import React, { useState, useEffect } from 'react';
import Gauge from './components/Gauge';
import History from './components/History';
import './App.css';

function App() {
  const [latestReading, setLatestReading] = useState({ ppm: 0, level: '-' });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9090');

    ws.onopen = () => {
      console.log('Conectado al servidor WebSocket');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'new_reading') {
        setLatestReading(data.payload);
        setHistory((prevHistory) => [data.payload, ...prevHistory].slice(0, 100));
      } else if (data.type === 'history') {
        setHistory(data.payload);
        if (data.payload.length > 0) {
          setLatestReading(data.payload[0]);
        }
      }
    };

    ws.onclose = () => {
      console.log('Desconectado del servidor WebSocket');
    };

    return () => {
      ws.close();
    };
  }, []);

  const getStatusColorClass = (level) => {
    switch (level) {
      case 'ATENCION':
        return 'color-atencion';
      case 'PELIGRO':
        return 'color-peligro';
      case 'CRITICO':
        return 'color-critico';
      default:
        return 'color-normal';
    }
  };

  return (
    <div className={`main-container ${getStatusColorClass(latestReading.level)}`}>
      <h1>Monitor de Gas en Tiempo Real</h1>
      <div className="status-text">{latestReading.level}</div>
      <Gauge ppm={latestReading.ppm} />
      <History readings={history} />
    </div>
  );
}

export default App;
