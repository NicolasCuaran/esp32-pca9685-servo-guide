# Changelog

Todos los cambios notables de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] — 2026-05-15

### Añadido
- Modelo 3D completo: ESP32-WROOM-32 sobre placa expansora Electrodemy/DOIT,
  PCA9685 con terminal de tornillos, 4 servos Tower Pro SG90 en CH0–CH3.
- Guía de 6 pasos (4 obligatorios + 2 opcionales) con cámara animada.
- Overlay HTML/SVG de etiquetas de pin con líneas guía y auto-stack sin solape.
- Cámara doble: órbita libre (sin restricciones) y vuelo libre WASD estilo FPS.
- Modal de bienvenida de 3 slides con persistencia en `localStorage`.
- Cables progresivos acumulativos + checkmarks de pasos visitados.
- Ficha técnica por pin al hacer click (voltaje, función, descripción).
- Lista de materiales (BOM) en el sidebar.
- 4 sketches Arduino verificados con `arduino-cli` + ESP32 real:
  `i2c_scan`, `i2c_diag`, `servo_test`, `servo_off`.
- Despliegue automático a GitHub Pages vía GitHub Actions.
- Documentación de comunidad: README, CONTRIBUTING, CODE_OF_CONDUCT,
  SECURITY, plantillas de issue y PR.

### Detalles técnicos
- Pinout del ESP32 DevKit V1 verificado contra LastMinuteEngineers y CircuitState.
- Bug corregido: servos desalineados con sus headers reales del PCA9685.
- Bug corregido: terminal de tornillos reubicado al lado correcto (ref. LME).
- Etiquetas TX2/RX2 renombradas a D17/D16 según serigrafía real del expansor.

[1.0.0]: https://github.com/NicolasCuaran/esp32-pca9685-servo-guide/releases/tag/v1.0.0
