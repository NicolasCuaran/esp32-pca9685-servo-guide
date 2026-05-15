# Contribuir

¡Bienvenido! Este proyecto vive de aportes de la comunidad. Aquí lo esencial.

## Filosofía
- **Una responsabilidad por archivo** (SRP). El proyecto tiene 20+ módulos cortos en vez de monstruos de 500 líneas.
- **Sin build system**. No agregamos Node, Webpack ni TypeScript. Three.js viene desde CDN vía import maps.
- **El usuario aprende algo**. Cada UI nueva debería responder a un *por qué*, no solo a un *qué*.

## Cómo correrlo localmente
```bash
git clone https://github.com/<tu-usuario>/pca9685-esp32-3d-guide.git
cd pca9685-esp32-3d-guide
python -m http.server 5500
```
Abre `http://localhost:5500`.

## Estructura de los módulos
- `js/data/` — datos puros (sin Three.js, sin DOM)
- `js/components/` — primitivas 3D (Pin, Wire, PCA9685, etc.)
- `js/core/` — escena, cámara, raycaster
- `js/ui/` — DOM + overlays HTML/SVG
- `js/main.js` — único orquestador

## Convenciones de código
- ES Modules nativos, sin `default export` (más explícito).
- Funciones cortas, prefieren composición a herencia.
- Comentarios solo donde el **porqué** no es obvio.
- Para nuevos pasos en la guía, agrégalos en `js/data/connections.js`. Todo el resto se autoinfiere.

## Tipos de PR bienvenidos
- 🐛 Bugs visuales (cables mal alineados, labels superpuestos)
- 📐 Mejor precisión de pinout (otros expansores ESP32, otras versiones del PCA9685)
- 🌍 Traducciones (actualmente está en español)
- ♿ Accesibilidad (navegación por teclado, ARIA)
- 📱 Soporte táctil para móvil

## Tipos de PR que conviene discutir primero
- Añadir un build system (justificarlo bien)
- Reescribir en TypeScript
- Cambiar la arquitectura modular
- Añadir backend / cuentas de usuario

## Reporte de bugs
Incluye:
1. Navegador y versión (`chrome://version` o equivalente)
2. Captura o video del bug
3. Pasos exactos para reproducirlo
4. Si es un problema de geometría 3D: cámara y zoom usados

## Hardware test
Los sketches en `sketch_*/` se compilan y suben con `arduino-cli`. Si reportas un bug del firmware, indica tu **puerto serie** y la **velocidad de baud** que probaste.

## Licencia
Al contribuir aceptas que tu código entra al proyecto bajo la licencia MIT.
