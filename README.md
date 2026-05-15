# ESP32 + PCA9685 + 4× SG90 · Guía 3D interactiva

Visualización 3D paso-a-paso de cómo conectar el driver PWM **PCA9685** (16 canales) a un
**ESP32-WROOM-32** montado sobre su **placa expansora** (Electrodemy / DOIT) y mover **4 servos
Tower Pro SG90** en los canales CH0–CH3. Pensada para que cualquiera entienda la conexión
**sin ambigüedades**, con verificación en hardware real vía `arduino-cli`.

**Stack:** HTML + JS modular + Three.js desde CDN. Sin Node.js, sin build, sin dependencias.

---

## Cómo abrirlo

Los ES Modules no funcionan con `file://`. Sirve la carpeta por HTTP:

```bash
cd pca9685-esp32-3d-guide
python -m http.server 5500
```
Abre <http://localhost:5500>. Alternativa: VS Code + Live Server.

---

## Qué incluye la guía interactiva

### 1. Onboarding la primera vez
- **Welcome modal** de 3 slides: qué es, controles de cámara, cómo empezar.
- Persiste en `localStorage` (checkbox "no mostrar"). Vuelve a abrirlo con **?** o tecla `?`.

### 2. Lista de materiales (BOM)
En el sidebar izquierdo, con cantidad + descripción de cada parte (ESP32, expansora, PCA9685,
4× SG90, cables Dupont, USB).

### 3. 6 pasos guiados con cámara animada
| # | Origen (expansor) | Destino (PCA9685) | Color | Obligatorio |
|---|---|---|---|---|
| 1 | `PWR_GND` | GND  | negro     | ✓ |
| 2 | `I2C_VCC` | VCC  | rojo      | ✓ |
| 3 | `I2C_D21` | SDA  | azul      | ✓ |
| 4 | `I2C_D22` | SCL  | amarillo  | ✓ |
| 5 | `PWR_5V`  | V+   | rojo grueso | ✓ (con aviso de brownout si hay servos grandes) |
| 6 | Triplete `D5·S` | OE | blanco | opcional |

Cuando avanzas:
- **El cable nuevo se anima** apareciendo.
- **Los cables anteriores quedan visibles** (aparición progresiva → ves la conexión completa creciendo).
- **Checkmark ✓ verde** marca los pasos visitados en la lista.
- La **cámara vuela** al punto medio del cable nuevo.

### 4. Etiquetas inteligentes (overlay HTML/SVG)
- Cada pin importante tiene un label flotante color-codeado por función.
- Líneas guía SVG conectan el pin 3D con su label 2D.
- **Auto-stack vertical/horizontal** → nunca se solapan.
- Toggle **"Solo usados / Todos los pines"** (tecla `L`).

### 5. Click en pin → ficha técnica
Click sobre cualquier pin metálico abre tarjeta con:
nombre, GPIO, voltaje esperado, función, descripción educativa.

### 6. Dos modos de cámara
| Modo | Cómo |
|---|---|
| **Órbita libre** (default) | drag para rotar, rueda para zoom — sin restricciones de ángulo |
| **Vuelo libre** (tecla `F`) | WASD + Q/E + drag para mirar + Shift boost + rueda velocidad |

### 7. Test de servos en simulador
Botón **"Probar servos"** ejecuta un sweep senoidal con desfase en CH0–CH3 — los horns
blancos de los SG90 giran como en hardware real.

### 8. Sketches Arduino listos
Carpeta `sketch_*/` con 4 sketches verificados con `arduino-cli` + ESP32 real (CP210x en COMx):

| Sketch | Para qué |
|---|---|
| `sketch_i2c_scan` | Detecta dispositivos en el bus I²C |
| `sketch_i2c_diag` | Diagnóstico exhaustivo: niveles, pull-ups, 100/400 kHz, SDA/SCL invertidos |
| `sketch_servo_test` | Sweep CH0→CH3 uno a uno |
| `sketch_servo_off` | Centra todos los servos y apaga PWM |

Compilar y subir (reemplaza `COMx` por tu puerto real — en Linux/Mac suele ser `/dev/ttyUSB0`):
```bash
arduino-cli board list           # detecta tu puerto
arduino-cli compile --fqbn esp32:esp32:esp32 sketch_servo_test
arduino-cli upload  -p COMx --fqbn esp32:esp32:esp32 sketch_servo_test
```

---

## Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `←` `→` | Paso anterior / siguiente |
| `A` | Vista general (todas las conexiones) |
| `L` | Mostrar solo pines usados ↔ todos |
| `F` | Alternar cámara órbita ↔ vuelo libre |
| `R` | Reset cámara |
| `?` | Volver a abrir el welcome modal |

---

## Estructura

```
pca9685-esp32-3d-guide/
├── index.html
├── css/styles.css
├── js/
│   ├── main.js                     orquestador
│   ├── data/connections.js         fuente única de verdad (pines, pasos, colores)
│   ├── components/                 modelos 3D + datos visuales
│   │   ├── ESP32.js, ExpansionBoard.js, PCA9685.js
│   │   ├── Servo.js (Tower Pro SG90), ServoCable.js (trifilar)
│   │   ├── ExternalPSU.js, Wire.js, Pin.js
│   │   ├── PinLabel.js, TextDecal.js
│   ├── core/
│   │   ├── SceneManager.js         escena + luces + suelo
│   │   ├── CameraController.js     orbit ↔ fly + flyTo animado
│   │   ├── FlyController.js        FPS con WASD
│   │   └── InteractionManager.js   raycaster hover/click
│   └── ui/
│       ├── StepController.js       estado de pasos + visited set
│       ├── InfoPanel.js            panel derecho con descripción
│       ├── Tooltip.js              tooltip flotante por hover
│       ├── PinLabelOverlay.js      labels 2D + leader lines SVG
│       ├── PinDetail.js            ficha técnica al click
│       └── WelcomeModal.js         onboarding 3 slides
└── sketch_*/                       4 sketches Arduino
```

---

## Verificación en hardware (notas reales del debugging)

Durante el desarrollo encontramos un cable de SCL **cortocircuitado a GND**: el sketch
`sketch_i2c_diag` lo detectó (`SCL en LOW con pull-up interno`) sin necesidad de multímetro.
Tras desconectar y reconectar, el scanner detectó `0x40` (PCA9685) y `0x70` (All Call) — los 4
servos respondieron al sweep correctamente.

Si tu I²C falla, **siempre empieza por el diagnóstico**:
```bash
arduino-cli upload -p COMx --fqbn esp32:esp32:esp32 sketch_i2c_diag
```
El output te dice exactamente cuál pin está en corto o si SDA/SCL están invertidos.

---

## Referencias usadas en el diseño

Patrones de UX/UI tomados de simuladores de electrónica populares:
- **Wokwi** — animación de servos + simulación I²C
- **CRUMB** — visualización de tensión/corriente en cables, highlight de labels
- **circuito.io** — lista de materiales + sketch personalizado
- **Tinkercad Circuits** — click-pin → drag → click-pin para conectar
- **DCACLab** — interactividad pedagógica

Pinout del ESP32 DevKit V1 verificado contra LastMinuteEngineers y CircuitState.

---

## Licencia
MIT — modelos y código libres de usar y modificar.
