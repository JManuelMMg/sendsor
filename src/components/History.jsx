
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './History.css';

// Componente para personalizar la etiqueta de la barra
const CustomizedLabel = ({ x, y, width, height, value, level, levelsConfig }) => {
  const levelColor = levelsConfig[level]?.color || '#cccccc';
  return (
    <text 
      x={x + width / 2} 
      y={y - 5} 
      fill={levelColor}
      textAnchor="middle" 
      dominantBaseline="middle"
      fontSize="10"
    >
      {value}
    </text>
  );
};

const History = ({ readings, levelsConfig }) => {

  // Damos la vuelta a los datos para que el más antiguo aparezca primero en el gráfico
  const chartData = readings.slice().reverse();

  return (
    <div className="history-container">
      <h3 className="history-title">Historial de Producción</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(time) => new Date(time).toLocaleString()} 
            stroke="#b0b0b0"
            tick={{ fill: '#b0b0b0', fontSize: 10 }}
          />
          <YAxis 
            stroke="#b0b0b0"
            tick={{ fill: '#b0b0b0', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(30, 40, 50, 0.9)', border: '1px solid #8884d8' }} 
            labelStyle={{ color: '#ffffff' }}
            formatter={(value, name, props) => [`${value} PPM`, `Nivel: ${props.payload.level}`]}
          />
          <Legend wrapperStyle={{ color: '#ffffff' }} />
          <Bar 
            dataKey="ppm" 
            name="Nivel de Gas (PPM)"
            label={(props) => <CustomizedLabel {...props} levelsConfig={levelsConfig} />}
          > 
            {/* Se elimina la asignación estática de colores */}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default History;
