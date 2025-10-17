
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import SensorCard from './components/SensorCard';
import History from './components/History';
import AlertsPanel from './components/AlertsPanel'; // Importamos el panel
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
  const [readingsBySensor, setReadingsBySensor] = useState({});
  const [connected, setConnected] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSensorForHistory, setSelectedSensorForHistory] = useState('');
  const [alerts, setAlerts] = useState([]); // Nuevo estado para las alertas

  const historyRef = useRef();

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:9090');

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'history') {
          setReadingsBySensor(data.payload);
          if (!selectedSensorForHistory) {
            const firstSensorId = Object.keys(data.payload)[0];
            if (firstSensorId) setSelectedSensorForHistory(firstSensorId);
          }
        } else if (data.type === 'new_reading') {
          const { sensorId, ppm, timestamp } = data.payload;
          const level = getGasLevel(ppm);
          data.payload.level = level.label;

          // Lógica para crear alertas
          if (level.label === 'CRITICO' || level.label === 'BAJO') {
            const newAlert = {
              timestamp: format(new Date(timestamp), 'HH:mm:ss'),
              message: `Sensor ${sensorId} en estado ${level.label} (${ppm} PPM)`,
              level: level.label,
            };
            // Añadimos la nueva alerta al principio del array
            setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
          }

          setReadingsBySensor(prevReadings => ({
            ...prevReadings,
            [sensorId]: [data.payload, ...(prevReadings[sensorId] || [])],
          }));

          if (!selectedSensorForHistory) {
            setSelectedSensorForHistory(sensorId);
          }
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
  }, [selectedSensorForHistory]);

  const handleHistoryExport = async () => { /* ... */ };
  const handleTextExport = () => { /* ... */ };

  const sensorIds = Object.keys(readingsBySensor);

  return (
    <div className="App">
      <header className="App-header">{/* ... */}</header>

      <main>
        <div className="dashboard-container">{/* ... */}
            {sensorIds.length > 0 ? (
                sensorIds.map(sensorId => {
                    const readings = readingsBySensor[sensorId] || [];
                    const currentReading = readings.length > 0 ? readings[0] : { ppm: 0 };
                    const level = getGasLevel(currentReading.ppm);
                    return (
                        <SensorCard 
                            key={sensorId} 
                            sensorId={sensorId}
                            readings={readings}
                            currentPPM={currentReading.ppm}
                            level={level.label}
                            levelColor={level.color}
                        />
                    )
                })
            ) : (
                <p className='loading-sensors'>Esperando datos de los sensores de producción...</p>
            )}
        </div>

        {/* Panel de Alertas Renderizado */}
        <AlertsPanel alerts={alerts} />

        <div ref={historyRef} className="history-section-wrapper">
          <div className="history-controls">{/* ... */}
              <div className="sensor-selector-container">
                <label htmlFor="sensor-select">Ver historial de:</label>
                <select 
                  id="sensor-select"
                  value={selectedSensorForHistory}
                  onChange={e => setSelectedSensorForHistory(e.target.value)}
                >
                  {sensorIds.map(id => <option key={id} value={id}>{id}</option>)
                  }
                </select>
              </div>
              <DatePicker selected={startDate} onChange={date => setStartDate(date)} placeholderText="Fecha de inicio" />
              <DatePicker selected={endDate} onChange={date => setEndDate(date)} placeholderText="Fecha de fin" />
              <button onClick={handleHistoryExport}>Exportar a PDF</button>
              <button onClick={handleTextExport}>Exportar a Texto</button>
          </div>
          <History readings={readingsBySensor[selectedSensorForHistory] || []} levelsConfig={levels} />
        </div>
      </main>
    </div>
  );
}

export default App;
