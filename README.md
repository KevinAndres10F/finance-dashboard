# Personal Finance Dashboard

Un dashboard moderno de finanzas personales construido con React, Vite y Tailwind CSS, que utiliza Google Sheets como backend gratuito y flexible.

## ✨ Características

### 💰 Gestión Financiera
-   **Visualización de Datos:** Múltiples gráficos interactivos (tendencias, categorías, distribución)
-   **Tarjetas de Resumen:** Balance, Ingresos y Gastos del mes
-   **Gestión de Transacciones:** Lista completa con búsqueda y filtros avanzados
-   **Formulario Inteligente:** Agregar ingresos o gastos con categorías personalizables

### 📊 Estadísticas Avanzadas
-   **Tendencias Temporales:** Evolución de ingresos/gastos (últimos 6 meses)
-   **Análisis por Categorías:** Top categorías y distribución de gastos
-   **Métricas Clave:** Tasa de ahorro, gasto diario promedio, cambios porcentuales
-   **Análisis Semanal:** Gastos de las últimas 4 semanas

### 🎯 Sistema de Presupuestos
-   **Límites por Categoría:** Define presupuestos mensuales
-   **Indicadores Visuales:** Barras de progreso con alertas (verde/amarillo/rojo)
-   **Seguimiento en Tiempo Real:** Ve cuánto has gastado vs tu límite
-   **Persistencia Local:** Tus presupuestos se guardan automáticamente

### 🔍 Filtros y Búsqueda
-   **Búsqueda en Tiempo Real:** Encuentra transacciones por descripción o categoría
-   **Filtros Múltiples:** Por tipo (ingreso/gasto) y categoría
-   **Exportación a CSV:** Descarga tus datos filtrados
-   **Contador de Resultados:** Saber cuántas transacciones coinciden

### 🎨 Experiencia de Usuario
-   **Modo Oscuro:** Toggle entre tema claro y oscuro
-   **Diseño Responsivo:** Perfecto en móviles, tablets y desktop
-   **Animaciones Fluidas:** Transiciones suaves con Framer Motion
-   **Navegación por Tabs:** 4 secciones principales (Resumen, Transacciones, Estadísticas, Presupuestos)
-   **Backend en Google Sheets:** Integración directa para persistencia gratuita

## 🚀 Inicio Rápido

### Instalación

1.  Clonar el repositorio:
    ```bash
    git clone https://github.com/KevinAndres10F/finance-dashboard.git
    cd finance-dashboard
    ```

2.  Instalar dependencias:
    ```bash
    npm install
    ```

3.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```

4.  Abrir en el navegador: `http://localhost:5173`

### Construcción para Producción

```bash
npm run build
npm run preview
```

## 📦 Deploy

Para desplegar tu aplicación, consulta la [Guía de Deploy](./DEPLOY.md) con instrucciones detalladas para:
- ✅ Vercel (Recomendado)
- ✅ Netlify
- ✅ GitHub Pages
- ✅ Render

**Deploy rápido con Vercel:**
```bash
npm i -g vercel
vercel
```

## 📚 Documentación

-   [Guía de Integración con Google Sheets](./docs/GOOGLE_SHEETS_INTEGRATION.md): Configuración del backend
-   [Mejoras Implementadas](./MEJORAS.md): Lista completa de funcionalidades nuevas
-   [Guía de Deploy](./DEPLOY.md): Instrucciones paso a paso para publicar tu app

## 🛠 Tecnologías

-   **React 19** - Framework UI
-   **Vite** - Build tool ultrarrápido
-   **Tailwind CSS 4** - Estilos utility-first
-   **Recharts** - Gráficos interactivos
-   **Framer Motion** - Animaciones fluidas
-   **Lucide React** - Iconos modernos
-   **Google Sheets** - Backend gratuito

## 📱 Capturas de Pantalla

### Modo Claro
- Dashboard principal con resumen financiero
- Gráfico de gastos por categoría
- Últimas transacciones

### Modo Oscuro
- Tema oscuro completo
- Menor fatiga visual
- Todos los componentes adaptados

### Estadísticas
- Tendencias mensuales
- Top categorías
- Análisis semanal
- Métricas clave

### Presupuestos
- Límites por categoría
- Barras de progreso
- Alertas visuales

## 🎯 Casos de Uso

1. **Control Personal:** Lleva el control de tus finanzas diarias
2. **Presupuestos:** Define y respeta límites de gasto
3. **Análisis:** Identifica patrones de gasto con estadísticas
4. **Exportación:** Descarga tus datos para análisis externos
5. **Multi-dispositivo:** Accede desde cualquier lugar

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

**Kevin Andres**
- GitHub: [@KevinAndres10F](https://github.com/KevinAndres10F)

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

