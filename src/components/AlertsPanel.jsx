
import React, { useEffect, useRef } from 'react';
import './AlertsPanel.css';

const AlertsPanel = ({ alerts }) => {
  const alertsListRef = useRef(null);

  // Auto-scroll hacia la alerta más reciente (la de arriba)
  useEffect(() => {
    if (alertsListRef.current) {
      alertsListRef.current.scrollTop = 0;
    }
  }, [alerts]);

  return (
    <div className="alerts-panel">
      <h3 className="alerts-title">Centro de Alertas de Producción</h3>
      <div className="alerts-list" ref={alertsListRef}>
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <div key={index} className={`alert-item alert-${alert.level.toLowerCase()}`}>
              <span className="alert-timestamp">{alert.timestamp}</span>
              <span className="alert-message">{alert.message}</span>
            </div>
          ))
        ) : (
          <p className="no-alerts">No hay alertas de producción recientes.</p>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
