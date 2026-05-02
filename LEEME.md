# REPIC — Inmobili Internacional
## Sistema de Evaluación de Captación Inmobiliaria

### ¿Qué es esto?
Una app web progresiva (PWA) para evaluar visitas de captación de propiedades con el sistema REPIC de 13 criterios ponderados.

---

## 🚀 Cómo subirlo a internet (GRATIS) — Paso a paso

### Opción A: Netlify (la más fácil, recomendada)

**Paso 1:** Crea una cuenta gratis en https://netlify.com (puedes entrar con tu correo de Gmail)

**Paso 2:** Instala Node.js en tu computadora desde https://nodejs.org (descarga la versión LTS)

**Paso 3:** Abre la terminal (en Windows: busca "cmd" o "PowerShell") y ejecuta estos comandos:

```bash
# Navega a la carpeta del proyecto
cd repic-pwa

# Instala las dependencias
npm install

# Construye la app para producción
npm run build
```

**Paso 4:** Esto crea una carpeta llamada `dist/`. Sube esa carpeta a Netlify:
- Ve a https://app.netlify.com
- Arrastra la carpeta `dist/` al área que dice "drag and drop"
- ¡Listo! Te da una URL como `https://tu-app-12345.netlify.app`

**Paso 5 (opcional):** Cambia el nombre de la URL:
- En Netlify → Site settings → Change site name
- Ejemplo: `https://repic-inmobili.netlify.app`

---

### Opción B: Vercel

**Paso 1:** Crea cuenta en https://vercel.com

**Paso 2:** Instala Vercel CLI:
```bash
npm install -g vercel
```

**Paso 3:** En la carpeta del proyecto:
```bash
npm install
npm run build
cd dist
vercel
```

Sigue las instrucciones en pantalla. Te da una URL automática.

---

## 📱 Cómo "instalar" la app en el celular

Una vez que la app esté en línea:

1. Abre la URL en **Chrome** en tu celular
2. Chrome mostrará un banner que dice "Agregar a pantalla de inicio"
3. Si no aparece el banner:
   - Toca los 3 puntos (⋮) arriba a la derecha
   - Selecciona "Agregar a pantalla de inicio"
4. Se instala como si fuera una app nativa con el ícono de REPIC

### Para iPhone/Safari:
1. Abre la URL en Safari
2. Toca el botón de compartir (□↑)
3. Selecciona "Agregar a pantalla de inicio"

---

## 📂 Estructura del proyecto

```
repic-pwa/
├── index.html          ← Página principal
├── package.json        ← Dependencias
├── vite.config.js      ← Configuración + PWA
├── netlify.toml        ← Config para Netlify
├── public/
│   ├── favicon.svg     ← Ícono del navegador
│   ├── icon-192.png    ← Ícono PWA pequeño
│   └── icon-512.png    ← Ícono PWA grande
└── src/
    ├── main.jsx        ← Punto de entrada
    └── App.jsx         ← Toda la aplicación
```

---

## 🔧 Para desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

## 📋 Funcionalidades incluidas

- ✅ Alta, edición y desactivación de captadores
- ✅ Grabación de voz con transcripción automática
- ✅ Scorecard de 13 criterios con pesos ponderados
- ✅ Calificación en tiempo real con meta 4.0+
- ✅ Compartir resultados por WhatsApp y correo
- ✅ Dashboard con KPIs y evolución por captador
- ✅ Historial de evaluaciones con filtros
- ✅ Datos persistentes (se guardan en el navegador)
- ✅ Funciona sin internet una vez instalada (PWA)
- ✅ Diseño optimizado para celular
