/*
 * Test de conexión: 4 servos en CH0..CH3 del PCA9685.
 * Mueve UN servo a la vez (sweep 0°→180°→0°) para verificar
 * que cada canal responde. Salida por Serial para depuración.
 *
 * Hardware (según la guía 3D):
 *   ESP32 expansor PWR_5V  → PCA9685 V+
 *   ESP32 expansor PWR_GND → PCA9685 GND (y tierra común)
 *   ESP32 expansor I2C VCC → PCA9685 VCC
 *   ESP32 expansor I2C SDA → PCA9685 SDA  (GPIO21)
 *   ESP32 expansor I2C SCL → PCA9685 SCL  (GPIO22)
 *   Servos en CH0..CH3 (orden estándar: S amarillo / V+ rojo / GND marrón)
 */
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);

const uint8_t NUM_SERVOS   = 4;
const uint16_t SERVO_MIN   = 150;   // pulso para ~0°
const uint16_t SERVO_MAX   = 600;   // pulso para ~180°
const uint16_t SERVO_FREQ  = 50;    // 50 Hz típico

uint16_t angleToPulse(int deg) {
  deg = constrain(deg, 0, 180);
  return map(deg, 0, 180, SERVO_MIN, SERVO_MAX);
}

void parkAll() {
  for (uint8_t ch = 0; ch < NUM_SERVOS; ch++) {
    pwm.setPWM(ch, 0, angleToPulse(90));
  }
}

void sweepChannel(uint8_t ch) {
  Serial.printf("\n>> Probando CH%u\n", ch);

  Serial.println("   0 -> 180");
  for (int deg = 0; deg <= 180; deg += 3) {
    pwm.setPWM(ch, 0, angleToPulse(deg));
    delay(15);
  }
  delay(300);

  Serial.println("   180 -> 0");
  for (int deg = 180; deg >= 0; deg -= 3) {
    pwm.setPWM(ch, 0, angleToPulse(deg));
    delay(15);
  }
  delay(300);

  // Dejar el canal en posición central
  pwm.setPWM(ch, 0, angleToPulse(90));
  Serial.printf("   CH%u OK (centrado en 90)\n", ch);
  delay(500);
}

void setup() {
  Serial.begin(115200);
  delay(800);
  Serial.println("\n=== PCA9685 servo test ===");

  Wire.begin(21, 22);          // SDA=21, SCL=22 (default ESP32)

  if (!pwm.begin()) {
    Serial.println("ERROR: PCA9685 no responde en 0x40");
    Serial.println("       Revisa SDA/SCL/VCC/GND y vuelve a intentar.");
    while (true) { delay(1000); }
  }

  pwm.setOscillatorFrequency(27000000);
  pwm.setPWMFreq(SERVO_FREQ);
  Wire.setClock(400000);

  Serial.println("PCA9685 OK. Iniciando barrido individual...");
  parkAll();
  delay(800);
}

void loop() {
  for (uint8_t ch = 0; ch < NUM_SERVOS; ch++) {
    sweepChannel(ch);
  }
  Serial.println("\n--- ciclo completo ---");
  delay(1500);
}
