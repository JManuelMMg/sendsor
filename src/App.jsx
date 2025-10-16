
import React, { useState, useEffect } from 'react';
import Gauge from './components/Gauge';
import History from './components/History';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

  const exportDataAsText = () => {
    const header = 'Fecha y Hora,PPM,Nivel,Valor Raw\\n';
    const rows = history.map(
      (reading) =>
        `${new Date(reading.timestamp).toLocaleString()},${reading.ppm.toFixed(
          1
        )},${reading.level},${reading.raw}\\n`
    );
    const textContent = header + rows.join('');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gas_monitor_history.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    const input = document.getElementById('history-content');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('gas_monitor_history.pdf');
    });
  };
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
