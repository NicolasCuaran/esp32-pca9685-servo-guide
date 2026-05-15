/*
 * Detiene los servos: los centra en 90° y APAGA las 16 salidas PWM.
 * Tras un Park & Off el chip queda silencioso (V+ sigue presente pero no
 * hay pulsos PWM → los servos se quedan sin par y no zumban).
 */
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);

void setup() {
  Serial.begin(115200);
  delay(800);
  Wire.begin(21, 22);

  if (!pwm.begin()) {
    Serial.println("ERROR: PCA9685 no responde");
    while (true) delay(1000);
  }
  pwm.setOscillatorFrequency(27000000);
  pwm.setPWMFreq(50);

  Serial.println("Centrando CH0..CH3 en 90...");
  for (uint8_t ch = 0; ch < 4; ch++) pwm.setPWM(ch, 0, 375);  // ~90°
  delay(700);

  Serial.println("Apagando los 16 canales (PWM=0)...");
  for (uint8_t ch = 0; ch < 16; ch++) pwm.setPWM(ch, 0, 0);

  Serial.println("OK — PCA9685 en idle. Servos sin par. Puedes desconectar.");
}

void loop() { delay(2000); }
