
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Recibimos `levelColor` para la línea
const RealtimeLineChart = ({ data, levelColor }) => {
  // Los datos se usan en orden inverso para que el tiempo avance de izquierda a derecha
  const chartData = data.slice().reverse();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(time) => new Date(time).toLocaleTimeString()} 
          stroke="#8884d8"
          tick={{ fill: '#b0b0b0', fontSize: 12 }}
        />
        <YAxis 
          stroke="#8884d8" 
          tick={{ fill: '#b0b0b0', fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(30, 40, 50, 0.8)', border: '1px solid #8884d8'}} 
          labelStyle={{ color: '#ffffff' }}
        />
        <Line 
          type="monotone" 
          dataKey="ppm" 
          stroke={levelColor || '#8884d8'} /* Color dinámico */
          strokeWidth={2} 
          dot={false} 
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RealtimeLineChart;
