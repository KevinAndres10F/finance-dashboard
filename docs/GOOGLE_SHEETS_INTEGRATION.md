# Guía de Integración: Google Sheets Backend

Este documento detalla la integración técnica entre el Dashboard de Finanzas (React) y Google Sheets (Google Apps Script).

## 1. Arquitectura

-   **Frontend:** React + Vite
-   **Backend:** Google Apps Script (Web App)
-   **Base de Datos:** Google Sheets

## 2. Configuración del Script (Backend)

El script de Google Apps Script debe estar desplegado como una Web App con permisos de ejecución para "Cualquiera" (Anyone).

**URL Actual:**
`https://script.google.com/macros/s/AKfycbwvT2nZBMTsFi3do4b1rMzQstVxcQkJQNPZy7NGmdpxDUZG8QaUZmdpwHH6-m_NwROe/exec`

### Código del Script (`Code.gs`)

```javascript
const HOJA_TRANSACCIONES = "Transacciones";

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(HOJA_TRANSACCIONES);
    
    // ... lógica para procesar datos ...
    // NOTA: El script espera claves en minúsculas: monto, tipo, descripcion, etc.
    
    return ContentService.createTextOutput(JSON.stringify({status: "exito"}));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", msg: error.toString()}));
  }
}

function doGet(e) {
  // ... lógica para leer datos ...
}
```

## 3. Comunicación Frontend -> Backend

### Reglas de Oro para `POST`
Para evitar errores de CORS y asegurar que los datos lleguen:

1.  **Content-Type:** Debe ser `text/plain;charset=utf-8`.
2.  **Payload:** Las claves del objeto JSON deben ser **minúsculas** y sin tildes, coincidiendo exactamente con lo que espera el script.

**Ejemplo de Payload Correcto:**
```javascript
const payload = {
    monto: 150.00,
    tipo: "Gasto",
    descripcion: "Compra Supermercado",
    comercio: "Supermercado",
    categoria: "Alimentación",
    cuenta: "Principal"
};
```

### Reglas de Oro para `GET`
El script devuelve los datos usando los nombres de las columnas de la hoja de cálculo (que pueden tener mayúsculas y tildes).

**Normalización en Frontend:**
Es necesario normalizar los datos al recibirlos para asegurar que la aplicación funcione aunque cambien los nombres en la hoja.

```javascript
const normalizedData = rawData.map(item => ({
    ...item,
    Categoría: item.Categoría || item.Categoria || 'Otros',
    // ...
}));
```

## 4. Solución de Problemas

| Problema | Causa Probable | Solución |
| :--- | :--- | :--- |
| **Error 401 Unauthorized** | URL del script incorrecta o antigua. | Verificar `API_URL` en `useFinanzas.js`. |
| **Error de CORS** | Cabeceras incorrectas o uso de `mode: 'no-cors'`. | Usar `Content-Type: text/plain` y eliminar `no-cors`. |
| **Datos vacíos en la hoja** | Nombres de claves JSON no coinciden con el script. | Revisar que el payload use minúsculas (`monto`, no `Monto`). |
