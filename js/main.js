import * as THREE from 'three';

import { SceneManager }       from './core/SceneManager.js';
import { CameraController }   from './core/CameraController.js';
import { InteractionManager } from './core/InteractionManager.js';

import { ExpansionBoard } from './components/ExpansionBoard.js';
import { PCA9685 }        from './components/PCA9685.js';
import { ExternalPSU }    from './components/ExternalPSU.js';
import { Wire }           from './components/Wire.js';
import { Servo }          from './components/Servo.js';
import { ServoCable }     from './components/ServoCable.js';

import { StepController }   from './ui/StepController.js';
import { InfoPanel }        from './ui/InfoPanel.js';
import { Tooltip }          from './ui/Tooltip.js';
import { PinLabelOverlay }  from './ui/PinLabelOverlay.js';
import { WelcomeModal }     from './ui/WelcomeModal.js';
import { PinDetail }        from './ui/PinDetail.js';

import { STEPS, WIRE_COLORS, BOARD_INFO, ESP32_PINS } from './data/connections.js';

/* ─── 1. Escena + cámara + interacción ─────────────────────── */
const canvas = document.getElementById('webgl');
const sm = new SceneManager(canvas);
const cam = new CameraController(sm.camera, sm.renderer.domElement);
const interaction = new InteractionManager(canvas, sm.camera);

/* ─── 2. Placas ────────────────────────────────────────────── */
const exp = new ExpansionBoard();
exp.group.position.set(-55, 0, 0);
sm.scene.add(exp.group);
const esp32 = exp.esp32;  // ESP32 anidado dentro de la expansion

const pca = new PCA9685();
pca.group.position.set(55, 0, 0);
pca.group.rotation.y = Math.PI;
sm.scene.add(pca.group);

// Fuente externa: solo se añade a la escena si algún paso la usa (paso opcional)
const psu = new ExternalPSU();
const usesPSU = STEPS.some(s => s.from.board === 'external' || s.to.board === 'external');
if (usesPSU) {
  psu.group.position.set(60, 0, 70);
  sm.scene.add(psu.group);
}

const boards = { exp, esp32, pca, external: psu };

// Registrar pines clickeables (incluidos los del ESP32 anidado)
[exp, pca, psu].forEach(b =>
  Object.values(b.pins).forEach(p => interaction.registerPin(p))
);
Object.values(esp32.pins).forEach(p => interaction.registerPin(p));

/* ─── 2b. Servos en CH0-CH3 ───────────────────────────────────── */
const servos = [];
const servoCables = [];
const servoColors = [0x1761b8, 0x1976d2, 0x1565c0, 0x0d47a1];

// Calculamos el centro de los 4 canales en world X, luego espaciamos los servos
// con una separación realista (15) — los cables curvarán para llegar al header.
const anchorCenter = (
  pca.getChannelAnchors(0).signal.x + pca.getChannelAnchors(3).signal.x
) / 2;
const SERVO_SPACING = 14;
const SERVO_BASE_X = anchorCenter - (3 * SERVO_SPACING) / 2;
const headerZ = pca.getChannelAnchors(0).signal.z;
const SERVO_Z = headerZ + 32;   // los servos al frente (z mayor → hacia cámara)

for (let i = 0; i < 4; i++) {
  const servo = new Servo(i, { color: servoColors[i] });
  servo.group.position.set(SERVO_BASE_X + i * SERVO_SPACING, 0, SERVO_Z);
  servo.group.rotation.y = Math.PI;  // cable mirando hacia el PCA
  sm.scene.add(servo.group);
  servos.push(servo);

  const cable = new ServoCable(servo, pca.getChannelAnchors(i));
  cable.addTo(sm.scene);
  cable.show(true);
  servoCables.push(cable);
}

/* ─── 3. Cables ────────────────────────────────────────────── */
const wires = STEPS.map(step => {
  const fromBoard = boards[step.from.board];
  const toBoard   = boards[step.to.board];
  const a = fromBoard.getPin(step.from.pin).getAnchorWorld();
  const b = toBoard.getPin(step.to.pin).getAnchorWorld();
  const wire = new Wire(a, b, WIRE_COLORS[step.color]);
  sm.scene.add(wire.mesh);
  return { step, wire };
});

/* ─── 4. Overlay 2D de etiquetas ───────────────────────────── */
const labels = new PinLabelOverlay(canvas, sm.camera);

// Pines usados en algún paso → primarios
const usedKey = new Set();
for (const s of STEPS) {
  usedKey.add(`${s.from.board}.${s.from.pin}`);
  usedKey.add(`${s.to.board}.${s.to.pin}`);
}
const isUsed = (boardId, pinId) => usedKey.has(`${boardId}.${pinId}`);

// Expansion board: bloques PWR (abajo), I²C + D5·S (derecha) — primarios o aux según uso
Object.values(exp.pins).forEach(p => {
  labels.register(p, {
    side: p.id.startsWith('PWR') ? 'bottom' : 'right',
    used: isUsed('exp', p.id)
  });
});

// Etiquetas de los 26 tripletes (nombre del GPIO al lado de cada fila) → aux
Object.values(exp.tripletPins).forEach(vp => {
  const isLeft = vp._local.x < 0;
  labels.register(vp, {
    side: isLeft ? 'left' : 'right',
    used: false
  });
});

// Los 30 pines del ESP32 anidado quedan accesibles por hover/tooltip (no saturan el overlay).

// PCA9685 logic pins → primarios o aux según uso
for (const id of Object.keys(pca.pins)) {
  labels.register(pca.getPin(id), {
    side: 'right',
    used: isUsed('pca', id)
  });
}

// PCA9685 canales servo (16) → aux, side='top'
pca.channels.forEach(ch => labels.register(ch, { side: 'top', used: false }));

// PCA9685 bornes del terminal de tornillos (V+/GND) → aux
pca.terminals.forEach(t => labels.register(t, { side: 'right', used: false }));

// Fuente externa
labels.register(psu.getPin('PSU+'), { side: 'right', used: true });
labels.register(psu.getPin('PSU-'), { side: 'right', used: true });

/* ─── 5. UI ────────────────────────────────────────────────── */
const panel = new InfoPanel(document.getElementById('panel'));
const tooltip = new Tooltip(document.getElementById('tooltip'));
const stepCtrl = new StepController(STEPS);

document.getElementById('btn-prev').onclick = () => stepCtrl.prev();
document.getElementById('btn-next').onclick = () => stepCtrl.next();
document.getElementById('btn-all').onclick  = () => stepCtrl.showOverview();
document.getElementById('btn-reset').onclick = () => cam.reset();

let showAllLabels = false;
const btnLabels = document.getElementById('btn-labels');
function setShowAllLabels(v) {
  showAllLabels = v;
  labels.setShowAll(v);
  btnLabels.textContent = v ? 'Todos los pines' : 'Solo usados';
  btnLabels.classList.toggle('on', v);
}
btnLabels.onclick = () => setShowAllLabels(!showAllLabels);
setShowAllLabels(false);

// Vuelo libre — toggle + HUD
const btnFly = document.getElementById('btn-fly');
const flyHud = document.getElementById('fly-hud');
function setFly(on) {
  cam.setMode(on ? 'fly' : 'orbit');
  btnFly.classList.toggle('on', on);
  flyHud.classList.toggle('visible', on);
  btnFly.textContent = on ? 'Salir vuelo' : 'Vuelo libre';
}
btnFly.onclick = () => setFly(cam.mode !== 'fly');

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') stepCtrl.next();
  else if (e.key === 'ArrowLeft') stepCtrl.prev();
  else if (e.key === 'a' && cam.mode !== 'fly') stepCtrl.showOverview();
  else if (e.key === 'r') cam.reset();
  else if (e.key === 'l' && cam.mode !== 'fly') setShowAllLabels(!showAllLabels);
  else if (e.key === 'f' || e.key === 'F') setFly(cam.mode !== 'fly');
});

const stepList = document.getElementById('step-list');
STEPS.forEach((s, i) => {
  const li = document.createElement('li');
  li.dataset.index = i;
  li.innerHTML = `
    <span class="chip" style="background:#${WIRE_COLORS[s.color].toString(16).padStart(6,'0')}"></span>
    <span class="step-name">${s.title}</span>
    ${s.required ? '' : '<span class="opt">opc</span>'}
  `;
  li.onclick = () => stepCtrl.goTo(i);
  stepList.appendChild(li);
});

// Info de placas en sidebar — ahora 3 boards
document.getElementById('esp32-name').textContent  = BOARD_INFO.exp.name;
document.getElementById('esp32-notes').textContent = BOARD_INFO.exp.notes;
document.getElementById('pca-name').textContent    = BOARD_INFO.pca.name;
document.getElementById('pca-notes').textContent   = BOARD_INFO.pca.notes;

/* ─── 6. Reacción a cambios de paso ────────────────────────── */
function highlightStep(state) {
  [exp, pca, psu].forEach(b => Object.values(b.pins).forEach(p => p.highlight(false)));
  Object.values(esp32.pins).forEach(p => p.highlight(false));
  labels.clearHighlights();

  if (state.mode === 'overview') {
    wires.forEach(w => w.wire.show());
    panel.showOverview(STEPS.length);
    cam.reset();
  } else {
    // Acumulativo: muestra todos los cables hasta el paso actual
    wires.forEach((w, idx) => {
      if (idx <= state.index) w.wire.show();
      else w.wire.hide();
    });
    const current = wires[state.index];
    stepCtrl.markVisited();

    const fromBoard = boards[current.step.from.board];
    const toBoard   = boards[current.step.to.board];
    const pinA = fromBoard.getPin(current.step.from.pin);
    const pinB = toBoard.getPin(current.step.to.pin);
    const color = WIRE_COLORS[current.step.color];
    pinA.highlight(true, color);
    pinB.highlight(true, color);
    labels.highlight(pinA, true);
    labels.highlight(pinB, true);

    panel.renderStep(current.step, state.index, STEPS.length);

    const a = pinA.getAnchorWorld();
    const b = pinB.getAnchorWorld();
    const target = a.clone().add(b).multiplyScalar(0.5);
    const offset = new THREE.Vector3(0, 65, 90);
    cam.flyTo(target, target.clone().add(offset));
  }

  [...stepList.children].forEach((li, i) => {
    li.classList.toggle('active', state.mode === 'step' && i === state.index);
    li.classList.toggle('done', state.visited.has(STEPS[i].id));
  });
}

stepCtrl.onChange(highlightStep);
stepCtrl.showOverview();

/* ─── 7. Hover/click sobre pines ───────────────────────────── */
interaction.on('hover',  pin => { pin.highlight(true, 0xffffff); labels.highlight(pin, true); tooltip.show(pin); });
interaction.on('leave',  pin => { pin.highlight(false); labels.highlight(pin, false); tooltip.hide(); refreshHighlight(); });
const pinDetail = new PinDetail();
interaction.on('click',  pin => pinDetail.show(pin));

function refreshHighlight() { highlightStep(stepCtrl.snapshot()); }

/* ─── 8. Test de servos (sweep automático) ────────────────── */
let servoTestActive = false;
let servoTestT = 0;

function startServoTest() {
  servoTestActive = true;
  servoTestT = 0;
  document.getElementById('btn-servos').classList.add('on');
  document.getElementById('btn-servos').textContent = 'Detener servos';
}
function stopServoTest() {
  servoTestActive = false;
  servos.forEach(s => s.setAngle(90));
  document.getElementById('btn-servos').classList.remove('on');
  document.getElementById('btn-servos').textContent = 'Probar servos';
}
document.getElementById('btn-servos').onclick = () =>
  servoTestActive ? stopServoTest() : startServoTest();

function updateServos(dt) {
  if (servoTestActive) {
    servoTestT += dt;
    // Cada servo con desfase de fase para que se vea bonito
    servos.forEach((s, i) => {
      const phase = i * (Math.PI / 4);
      const a = 90 + 80 * Math.sin(servoTestT * 1.8 + phase);
      s.setAngle(a);
    });
  }
  servos.forEach(s => s.update(dt));
}

/* ─── 9. Loop ─────────────────────────────────────────────── */
const clock = new THREE.Clock();
function loop() {
  const dt = clock.getDelta();
  cam.update(dt);
  interaction.update();
  wires.forEach(w => w.wire.update(dt));
  servoCables.forEach(c => c.update(dt));
  updateServos(dt);
  labels.update();
  sm.render();
  requestAnimationFrame(loop);
}
loop();

document.getElementById('loader')?.remove();

/* ─── 10. Welcome modal ────────────────────────────────────── */
const welcome = new WelcomeModal();
welcome.open(false);
document.getElementById('btn-help').onclick = () => welcome.open(true);
document.addEventListener('keydown', e => {
  if (e.key === '?' || (e.shiftKey && e.key === '/')) welcome.open(true);
});
