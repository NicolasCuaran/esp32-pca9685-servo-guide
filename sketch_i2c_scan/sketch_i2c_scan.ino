#include <Wire.h>
void setup() {
  Serial.begin(115200);
  delay(800);
  Wire.begin(21, 22);          // SDA, SCL
  Serial.println("\n=== I2C scanner (SDA=21 SCL=22) ===");
  byte count = 0;
  for (byte a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Dispositivo en 0x%02X\n", a);
      count++;
    }
  }
  if (count == 0) {
    Serial.println("NINGUN dispositivo detectado.");
    Serial.println("→ Revisa: GND comun, VCC del PCA9685 (3V3),");
    Serial.println("  SDA→GPIO21, SCL→GPIO22.");
  } else {
    Serial.printf("Total: %u dispositivo(s).\n", count);
  }
}
void loop() { delay(5000); }
