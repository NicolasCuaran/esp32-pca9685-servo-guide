# Política de Seguridad

## Naturaleza del proyecto

Este es un proyecto **100% front-end estático**: HTML + JavaScript + Three.js
desde CDN. No tiene backend, base de datos, autenticación ni procesamiento de
datos de usuario. No recoge ni transmite información personal.

El único almacenamiento es `localStorage` del navegador, usado para recordar si
el modal de bienvenida ya se cerró. No se envía a ningún servidor.

## Superficie de ataque

- **Sin secretos**: el repo no contiene tokens, claves ni credenciales.
- **Sin dependencias instaladas**: Three.js se carga vía `importmap` desde
  `unpkg.com` con versión fijada (`three@0.160.1`).
- **Sketches Arduino**: código C++ para microcontrolador, sin red.

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad (por ejemplo, una dependencia CDN
comprometida o un XSS en el overlay de etiquetas):

1. **No** abras un issue público con los detalles del exploit.
2. Usa la pestaña **Security → Report a vulnerability** de GitHub
   (GitHub Private Vulnerability Reporting).
3. Incluye pasos de reproducción y navegador afectado.

Tiempo de respuesta objetivo: **7 días**.

## Buenas prácticas para quien hace fork

- Si despliegas en tu propio dominio, mantén la versión fijada de Three.js
  o usa Subresource Integrity (SRI).
- No introduzcas credenciales en el código: este proyecto es público por diseño.
