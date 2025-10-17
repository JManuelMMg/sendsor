
import React from 'react';
import Gauge from './Gauge';
import RealtimeLineChart from './RealtimeLineChart';
import './SensorCard.css';

// Recibimos `levelColor` para el aura
const SensorCard = ({ sensorId, readings, currentPPM, level, levelColor }) => {
  const recentReadings = readings.slice(0, 20);

  // Pasamos el color directamente al estilo del aura
  const auraStyle = {
    boxShadow: `0 0 35px 15px ${levelColor || 'rgba(44, 92, 45, 0.6)'}`
  };

  return (
    <div className={`sensor-card`}>
      <h3 className="sensor-title">{sensorId}</h3>
      <div className="card-content">
        <div className="gauge-container-card">
          <div className="gauge-aura" style={auraStyle}></div>
          <Gauge value={currentPPM} />
        </div>
        <div className="realtime-chart-container">
          {/* Pasamos `levelColor` para la línea del gráfico */}
          <RealtimeLineChart data={recentReadings} levelColor={levelColor} />
        </div>
      </div>
    </div>
  );
};

export default SensorCard;
