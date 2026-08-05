# 🚀 Guía de Deploy - Finance Dashboard

Tu proyecto está listo para ser desplegado. Aquí tienes 3 opciones fáciles y **GRATUITAS**:

## Opción 1: Vercel (Recomendada ⭐)

### Deploy desde GitHub (Más Fácil)
1. Ve a [vercel.com](https://vercel.com)
2. Haz click en "Sign Up" o "Login" (puedes usar tu cuenta de GitHub)
3. Click en "Add New" → "Project"
4. Importa tu repositorio: `KevinAndres10F/finance-dashboard`
5. Vercel detectará automáticamente que es un proyecto Vite
6. Click en "Deploy"
7. ¡Listo! Tu app estará en: `https://tu-proyecto.vercel.app`

### Deploy desde Terminal
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Sigue las instrucciones en pantalla
# La primera vez te pedirá autenticarte
```

## Opción 2: Netlify

### Deploy desde GitHub
1. Ve a [netlify.com](https://netlify.com)
2. Click en "Sign Up" o "Login"
3. Click en "Add new site" → "Import an existing project"
4. Selecciona GitHub y autoriza
5. Selecciona tu repositorio: `finance-dashboard`
6. Configuración:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click en "Deploy site"
8. ¡Listo! Tu app estará en: `https://tu-proyecto.netlify.app`

### Deploy desde Terminal
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
# Cuando pregunte por el directorio, escribe: dist
```

## Opción 3: GitHub Pages

1. Ve a la configuración de tu repositorio en GitHub
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: selecciona `main` y carpeta `/ (root)`
5. O usa este comando:

```bash
# Instalar gh-pages
npm install --save-dev gh-pages

# Agregar scripts a package.json (ya están incluidos)
# Luego ejecutar:
npm run deploy
```

## Opción 4: Render

1. Ve a [render.com](https://render.com)
2. Sign up / Login
3. Click "New" → "Static Site"
4. Conecta tu repositorio de GitHub
5. Configuración:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
6. Click "Create Static Site"

## ⚡ Deploy Instantáneo (Desde GitHub)

La forma MÁS RÁPIDA es:

1. **Ve a Vercel.com**
2. **Click en "Import Project"**
3. **Pega la URL**: `https://github.com/KevinAndres10F/finance-dashboard`
4. **Click Deploy**
5. **¡Espera 1 minuto y listo!**

## 🔄 Auto-Deploy

Una vez configurado con Vercel o Netlify:
- Cada vez que hagas `git push` a main
- Se desplegará automáticamente la nueva versión
- Sin hacer nada más

## 🌐 URLs de Ejemplo

Después del deploy, tendrás una URL como:
- Vercel: `https://finance-dashboard-abc123.vercel.app`
- Netlify: `https://finance-dashboard-abc123.netlify.app`
- GitHub Pages: `https://kevinandres10f.github.io/finance-dashboard`

## ✅ Verificación

Para verificar que todo funciona:
1. Abre la URL de tu deploy
2. Verifica que:
   - El sitio carga correctamente
   - Puedes cambiar entre tabs
   - El dark mode funciona
   - Puedes agregar una transacción de prueba
   - Los gráficos se muestran correctamente

## 🐛 Solución de Problemas

### Error: Build failed
- Verifica que `npm run build` funcione localmente
- Revisa los logs del deploy

### La app muestra página en blanco
- Revisa la consola del navegador (F12)
- Verifica que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas

### Las transacciones no se guardan
- Verifica que las políticas RLS estén aplicadas en Supabase
- Revisa la consola del navegador para errores de permisos

## 💡 Consejo

**Recomiendo Vercel** porque:
- Es el más rápido
- Tiene excelente integración con GitHub
- Deploy automático en cada push
- SSL gratis
- CDN global
- Configuración cero

---

¿Necesitas ayuda? Abre un issue en el repositorio.
