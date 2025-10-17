
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import SensorCard from './components/SensorCard';
import History from './components/History';
import AlertsPanel from './components/AlertsPanel';
import './App.css';

const levels = {
  CRITICO: { limit: 150, color: '#b22222', label: 'CRITICO' },
  BAJO: { limit: 400, color: '#b8860b', label: 'BAJO' },
  PRODUCIENDO: { limit: 800, color: '#2c5c2d', label: 'PRODUCIENDO' },
  OPTIMO: { limit: Infinity, color: '#1a73e8', label: 'OPTIMO' },
};

const getGasLevel = (ppm) => {
  if (ppm < levels.CRITICO.limit) return levels.CRITICO;
  if (ppm < levels.BAJO.limit) return levels.BAJO;
  if (ppm < levels.PRODUCIENDO.limit) return levels.PRODUCIENDO;
  return levels.OPTIMO;
};

function App() {
  const [readings, setReadings] = useState([]);
  const [connected, setConnected] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const historyRef = useRef();
  const alarmSoundRef = useRef(null); 

  useEffect(() => {
    const connect = () => {
        const ws = new WebSocket('ws://localhost:9090');
        ws.onopen = () => setConnected(true);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'history') {
                setReadings(data.payload);
            } else if (data.type === 'new_reading') {
                const { ppm, timestamp } = data.payload;
                const level = getGasLevel(ppm);
                data.payload.level = level.label;
                if (level.label === 'CRITICO' || level.label === 'BAJO') {
                    const newAlert = {
                        timestamp: format(new Date(timestamp), 'HH:mm:ss'),
                        message: `Nivel de producción ${level.label} (${ppm} PPM)`,
                        level: level.label,
                    };
                    setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
                    if (level.label === 'CRITICO' && alarmSoundRef.current) {
                        alarmSoundRef.current.play().catch(error => console.log("Error al reproducir sonido:", error));
                    }
                }
                setReadings(prevReadings => [data.payload, ...prevReadings]);
            }
        };
        ws.onclose = () => {
            setConnected(false);
            setTimeout(connect, 3000);
        };
        ws.onerror = (error) => {
            console.error('Error en WebSocket:', error);
            ws.close();
        };
    };
    connect();
  }, []);

  const filteredReadings = useMemo(() => {
      if (!startDate && !endDate) return readings;
      return readings.filter(reading => {
          const readingDate = new Date(reading.timestamp);
          const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
          const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
          if (start && readingDate < start) return false;
          if (end && readingDate > end) return false;
          return true;
      });
  }, [readings, startDate, endDate]);

  const handleHistoryExport = async () => {
    if (filteredReadings.length === 0) {
      alert('No hay datos en el rango de fechas seleccionado para exportar.');
      return;
    }
    const historyElement = historyRef.current;
    if (!historyElement) return;

    const canvas = await html2canvas(historyElement, { useCORS: true, backgroundColor: '#111827' });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(20);
    pdf.text('Reporte de Historial de Producción', pdfWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(12);
    const dateRange = `Desde: ${startDate ? format(startDate, 'dd/MM/yyyy') : 'Inicio'} - Hasta: ${endDate ? format(endDate, 'dd/MM/yyyy') : 'Fin'}`;
    pdf.text(dateRange, pdfWidth / 2, 30, { align: 'center' });

    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 10, 40, pdfWidth - 20, imgHeight);

    pdf.save(`reporte-historial-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleTextExport = () => {
    if (filteredReadings.length === 0) {
      alert('No hay datos en el rango de fechas seleccionado para exportar.');
      return;
    }
    let textContent = 'Historial de Producción de Gas\n';
    const dateRange = `Desde: ${startDate ? format(startDate, 'dd/MM/yyyy HH:mm') : 'Inicio'} - Hasta: ${endDate ? format(endDate, 'dd/MM/yyyy HH:mm') : 'Fin'}\n\n`;
    textContent += dateRange;
    textContent += 'Timestamp\t\t\tPPM\tNivel de Producción\n';
    textContent += '-----------------------------------------------------------\n';

    const chronologicalReadings = [...filteredReadings].reverse();
    chronologicalReadings.forEach(reading => {
      const date = format(new Date(reading.timestamp), 'dd/MM/yyyy HH:mm:ss');
      textContent += `${date}\t${reading.ppm.toFixed(2)}\t${reading.level}\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-produccion-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentReading = readings.length > 0 ? readings[0] : { ppm: 0 };
  const currentLevel = getGasLevel(currentReading.ppm);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard de Producción de Gas</h1>
        <div className="status-light" style={{ backgroundColor: connected ? '#2ecc71' : '#e74c3c' }} />
        <span style={{ marginLeft: '10px' }}>{connected ? 'Conectado' : 'Desconectado'}</span>
      </header>

      <main>
        <div className="dashboard-container">
          {readings.length > 0 ? (
            <SensorCard 
              sensorId="Planta de Producción Principal"
              readings={readings}
              currentPPM={currentReading.ppm}
              level={currentLevel.label}
              levelColor={currentLevel.color}
            />
          ) : (
            <p className='loading-sensors'>Esperando datos del sensor de producción...</p>
          )}
        </div>

        <AlertsPanel alerts={alerts} />

        <div ref={historyRef} className="history-section-wrapper">
          <div className="history-controls">
            <DatePicker selected={startDate} onChange={date => setStartDate(date)} placeholderText="Fecha de inicio" />
            <DatePicker selected={endDate} onChange={date => setEndDate(date)} placeholderText="Fecha de fin" />
            <button onClick={handleHistoryExport}>Exportar a PDF</button>
            <button onClick={handleTextExport}>Exportar a Texto</button>
          </div>
          <History readings={filteredReadings} levelsConfig={levels} />
        </div>

        <audio ref={alarmSoundRef} src="/alarm.mp3" preload="auto"></audio>
      </main>
    </div>
  );
}

export default App;
