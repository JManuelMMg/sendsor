
import React, { useState, useEffect, useRef } from 'react';
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
  // Estado simplificado para un solo sensor
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

            // Sonar alarma solo para nivel CRITICO
            if (level.label === 'CRITICO' && alarmSoundRef.current) {
              alarmSoundRef.current.play().catch(error => console.log("Error al reproducir sonido:", error));
            }
          }
          
          // Añadimos la nueva lectura al estado
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

  const handleHistoryExport = async () => { /* ... */ };
  const handleTextExport = () => { /* ... */ };

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
              sensorId="Planta de Producción Principal" // Título Fijo
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
          <History readings={readings} levelsConfig={levels} />
        </div>

        <audio ref={alarmSoundRef} src="/alarm.mp3" preload="auto"></audio>
      </main>
    </div>
  );
}

export default App;
