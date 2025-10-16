
import React from 'react';
import { format } from 'date-fns';

const History = ({ readings }) => {
  return (
    <div className="history-container">
      <h2>Historial de Mediciones</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>PPM</th>
            <th>Nivel</th>
            <th>Valor Raw</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading, index) => (
            <tr key={index}>
              <td>{format(new Date(reading.timestamp), 'PPpp')}</td>
              <td>{reading.ppm.toFixed(1)}</td>
              <td>{reading.level}</td>
              <td>{reading.raw}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
