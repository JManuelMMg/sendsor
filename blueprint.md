
# Proyecto: Monitor de Gas en Tiempo Real con Arduino y React

## Visión General

El objetivo de este proyecto es crear una aplicación web para monitorear en tiempo real las lecturas de un sensor de gas (MQ-2) conectado a un Arduino (ESP8266). La aplicación mostrará los datos actuales en una interfaz atractiva y permitirá a los usuarios ver un historial de las mediciones.

## Características Implementadas

### Versión Inicial (MVP)

*   **Visualización en Tiempo Real:**
    *   Un medidor circular (gauge) mostrará la lectura de PPM (Partes por Millón) actual.
    *   El color del medidor cambiará según el nivel de riesgo (Normal, Atención, Peligro, Crítico).
    *   Se mostrará el estado actual del gas (ej. "PELIGRO").

*   **Historial de Mediciones:**
    *   Una tabla mostrará un registro de todas las mediciones recibidas.
    *   Cada fila en la tabla incluirá PPM, estado, valor raw del sensor, y la fecha/hora de la lectura.

*   **Backend y Comunicación:**
    *   Un servidor Node.js con Express y WebSockets.
    *   Un endpoint `/api/readings` para recibir datos del Arduino.
    *   Comunicación en tiempo real con el frontend usando WebSockets.

*   **Diseño y Estilo:**
    *   Interfaz con un tema oscuro, moderna y limpia.
    *   Diseño responsivo para que funcione en diferentes tamaños de pantalla.

## Plan de Desarrollo Actual

*   **Tarea 1: Configurar el Backend.**
    *   Instalar dependencias: `express` y `ws`.
    *   Crear un servidor Express en `server/index.js`.
    *   Configurar un servidor de WebSockets para la comunicación en tiempo real.
    *   Crear el endpoint `GET /api/readings` que el Arduino utilizará.
    *   Almacenar las lecturas en un array en memoria.

*   **Tarea 2: Modificar el Frontend.**
    *   Instalar dependencias: `react-circular-progressbar` para la gráfica y `date-fns` para formatear fechas.
    *   Establecer una conexión WebSocket con el backend.
    *   Crear el componente `Gauge.jsx` para el medidor circular.
    *   Crear el componente `History.jsx` para la tabla del historial.
    *   Actualizar `App.jsx` para juntar todos los componentes y manejar el estado de la aplicación.
    *   Actualizar los estilos en `App.css` y `index.css`.

*   **Tarea 3: Actualizar Scripts y Configuración.**
    *   Instalar `concurrently` para poder correr el servidor de frontend y el de backend simultáneamente.
    *   Añadir el script `server` y modificar el script `dev` en `package.json`.
    *   Actualizar el título en `index.html`.

*   **Tarea 4: Preparar para Firebase.**
    *   Crear el archivo de configuración `.idx/mcp.json` para la integración con Firebase.
