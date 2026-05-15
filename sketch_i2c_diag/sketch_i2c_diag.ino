/*
 * Diagnóstico I²C exhaustivo (sin tocar hardware):
 *  1. Nivel lógico estático de SDA/SCL con pull-up interno
 *     - Si lee LOW → pin cortocircuitado a GND, o nada conectado (no debería pasar con pull-up)
 *     - Si lee HIGH → línea libre, no hay esclavo respondiendo (normal antes de hablar)
 *  2. Scan I²C a 100 kHz en SDA=21, SCL=22
 *  3. Scan I²C a 400 kHz en SDA=21, SCL=22
 *  4. Scan I²C en pines invertidos SDA=22, SCL=21 (por si están cruzados físicamente)
 *  5. Direcciones I²C estándar del PCA9685 (0x40-0x7F) — chequeo dedicado
 *  6. Test bit-bang: pulsar SCL y leer SDA a ver si algún device hace ACK
 */
#include <Wire.h>

const int SDA_DEFAULT = 21;
const int SCL_DEFAULT = 22;

void printLevels(const char* tag, int sda, int scl) {
  pinMode(sda, INPUT_PULLUP);
  pinMode(scl, INPUT_PULLUP);
  delay(20);
  int s1 = digitalRead(sda);
  int s2 = digitalRead(scl);
  Serial.printf("[%s] SDA(pin %d)=%s  SCL(pin %d)=%s\n",
                tag, sda, s1 ? "HIGH" : "LOW",
                scl, s2 ? "HIGH" : "LOW");
  if (!s1) Serial.println("  !! SDA esta en LOW → cable a GND, esclavo retiene la linea, o pull-up insuficiente");
  if (!s2) Serial.println("  !! SCL esta en LOW → cable a GND, o pull-up insuficiente");
  if (s1 && s2) Serial.println("  OK: ambas lineas en HIGH con pull-up interno (no hay corto)");
}

int scanBus(uint32_t freq, int sda, int scl, const char* tag) {
  Serial.printf("\n--- Scan %s: SDA=%d SCL=%d @ %u Hz ---\n", tag, sda, scl, freq);
  Wire.end();
  delay(50);
  if (!Wire.begin(sda, scl, freq)) {
    Serial.println("  Wire.begin() devolvio false");
    return -1;
  }
  int count = 0;
  for (byte a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    byte err = Wire.endTransmission();
    if (err == 0) {
      Serial.printf("  Dispositivo en 0x%02X\n", a);
      count++;
    } else if (err == 4) {
      Serial.printf("  ERROR raro en 0x%02X (err=4)\n", a);
    }
    delay(2);
  }
  if (count == 0) Serial.println("  (vacio)");
  Serial.printf("  Total: %d\n", count);
  return count;
}

void specificPcaCheck(int sda, int scl) {
  Serial.printf("\n--- Chequeo dirigido PCA9685 en SDA=%d SCL=%d ---\n", sda, scl);
  Wire.end(); delay(30);
  Wire.begin(sda, scl, 100000);

  // PCA9685 puede estar en 0x40..0x7F segun jumpers A0..A5
  bool found = false;
  for (byte a = 0x40; a <= 0x7F; a++) {
    Wire.beginTransmission(a);
    byte err = Wire.endTransmission();
    if (err == 0) {
      Serial.printf("  PCA9685 candidato en 0x%02X\n", a);
      found = true;
    }
  }
  if (!found) Serial.println("  Ningun PCA9685 en rango 0x40..0x7F");
}

void manualBitProbe(int sda, int scl) {
  // Forzar SCL en HIGH y leer SDA; luego pulsar SCL a LOW unos us
  Serial.printf("\n--- Manual bit-probe en SDA=%d SCL=%d ---\n", sda, scl);
  pinMode(sda, INPUT_PULLUP);
  pinMode(scl, OUTPUT);
  digitalWrite(scl, HIGH); delayMicroseconds(10);
  int idle = digitalRead(sda);
  digitalWrite(scl, LOW);  delayMicroseconds(10);
  digitalWrite(scl, HIGH); delayMicroseconds(10);
  int after = digitalRead(sda);
  Serial.printf("  SDA en idle = %s | tras pulso SCL = %s\n",
                idle?"HIGH":"LOW", after?"HIGH":"LOW");
  // Restaurar
  pinMode(scl, INPUT_PULLUP);
}

void setup() {
  Serial.begin(115200);
  delay(900);
  Serial.println("\n\n========================================");
  Serial.println(" DIAGNOSTICO I2C — PCA9685 + ESP32 ");
  Serial.println("========================================");

  Serial.println("\n[1] Niveles logicos con pull-up interno:");
  printLevels("default 21/22", SDA_DEFAULT, SCL_DEFAULT);

  Serial.println("\n[2] Manual bit-probe:");
  manualBitProbe(SDA_DEFAULT, SCL_DEFAULT);

  int c100 = scanBus(100000, SDA_DEFAULT, SCL_DEFAULT, "[3] 100 kHz");
  int c400 = scanBus(400000, SDA_DEFAULT, SCL_DEFAULT, "[4] 400 kHz");
  int cswp = scanBus(100000, 22, 21, "[5] SDA/SCL invertidos");

  specificPcaCheck(SDA_DEFAULT, SCL_DEFAULT);
  specificPcaCheck(22, 21);

  Serial.println("\n========================================");
  Serial.println(" RESUMEN");
  Serial.println("========================================");
  Serial.printf("  Dispositivos @100kHz  21/22 : %d\n", c100);
  Serial.printf("  Dispositivos @400kHz  21/22 : %d\n", c400);
  Serial.printf("  Dispositivos @100kHz  22/21 : %d\n", cswp);
  if (c100==0 && c400==0 && cswp==0) {
    Serial.println("\n  CONCLUSION: bus I2C completamente vacio.");
    Serial.println("  El PCA9685 no esta alimentado o no comparte GND con el ESP32.");
    Serial.println("  Las lineas SDA/SCL responden a pull-up interno → no hay corto.");
  } else if (cswp > 0 && c100 == 0) {
    Serial.println("\n  CONCLUSION: SDA y SCL estan FISICAMENTE INVERTIDOS!");
    Serial.println("  Conmuta los cables D21 ↔ D22 en el bloque I2C del expansor.");
  } else if (c100 > 0 || c400 > 0) {
    Serial.println("\n  CONCLUSION: hay dispositivo(s) en el bus.");
  }
  Serial.println("\nFin del diagnostico.");
}
void loop() { delay(5000); }
