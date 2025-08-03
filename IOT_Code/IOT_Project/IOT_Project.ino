#include <WiFi.h>
#include <WiFiManager.h>
#include <Adafruit_AHTX0.h>
#include <SparkFun_ENS160.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// display setup
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// pin setup
const int IR_digitalPin = 27;
const int IR_analogPin = 34;
const int MQ9_digitalPin = 14;
const int MQ9_analogPin = 35;
const int MQ135_analogPin = 32;

Adafruit_AHTX0 aht21;
SparkFun_ENS160 ens160;

const float Vc = 3.3;     // ESP32 ADC reference voltage
const int RL = 10000;     // Load resistance in ohms
const float R0 = 5000.0;  // Sensor resistance in clean air


const float RLOAD = 10000.0;  // Load resistance in ohms
const float RZERO = 5000.0;   // Calibrated RZero in fresh air

const float PARA = 116.6020682;  // Empirical values for ppm estimation
const float PARB = -2.769034857;

const char* mqtt_server = "192.168.8.104";  // Replace with server's IP
const int mqtt_port = 1883;
const char* mqtt_topic = "sensor/data";

WiFiClient espClient;
PubSubClient client(espClient);

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected!");
    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}


void setupSensors() {
  Serial.begin(115200);
  pinMode(IR_digitalPin, INPUT);
  pinMode(MQ9_digitalPin, INPUT);
  Wire.begin(21, 22);

  if (!aht21.begin()) {
    Serial.println("Failed to find AHT21 sensor!");
  } else {
    Serial.println("AHT21 initialized.");
  }

  if (!ens160.begin()) {
    Serial.println("Failed to find ENS160 sensor!");
  } else {
    Serial.println("ENS160 initialized.");
    ens160.setOperatingMode(SFE_ENS160_STANDARD);
  }

  setupDisplay();
}

void setupDisplay() {
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("OLED allocation failed"));
    while (true)
      ;
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();
  delay(1000);
}

bool isFlameDetected() {
  return digitalRead(IR_digitalPin) == LOW;
}


int readFlameIntensity() {
  return analogRead(IR_analogPin);
}


bool isGasDetected() {
  return digitalRead(MQ9_digitalPin) == LOW;
}

// Get Rs from ADC reading
float getRs(int adcVal) {
  float voltage = (adcVal / 4095.0) * Vc;
  float Rs = (Vc - voltage) * RL / voltage;
  return Rs;
}

// Estimate ppm from Rs/R0 using curve equation
float getPPM(float rs_ro_ratio, float slope, float intercept) {
  return pow(10, (log10(rs_ro_ratio) - intercept) / slope);
}


float readCOPPM() {
  int adcVal = analogRead(MQ9_analogPin);
  float Rs = getRs(adcVal);
  float ratio = Rs / R0;

  float co_ppm = pow(10, (log10(ratio) - 0.27) / -0.77);  // CO
  return co_ppm;
}


// === Reads raw analog value and converts to resistance Rs ===
float getMQ135Rs(int adcValue) {
  float voltage = (adcValue / 4095.0) * Vc;
  float Rs = (Vc - voltage) * RLOAD / voltage;
  return Rs;
}

// === Estimate CO2 PPM based on Rs and RZERO ===
float readCO2PPM() {
  int adcVal = analogRead(MQ135_analogPin);
  float Rs = getMQ135Rs(adcVal);
  float ratio = Rs / RZERO;
  float ppm = PARA * pow(ratio, PARB);
  // ppm = constrain(ppm, 200, 10000);
  return ppm;
}

void updateDisplay(bool flameDetected, int flameIntensity, bool gasDetected, float co, float co2, float eco2, float tvoc, int aqi, float temperature, float relative_humidity) {
  display.clearDisplay();
  display.setCursor(0, 0);

  display.print("Flame: ");
  display.println(flameDetected ? "YES" : "NO");
  display.print("Flame Intensity: ");
  display.println(flameIntensity);
  display.print("CO: ");
  display.print(co);
  display.println(" ppm");
  //display.print("MQ135: "); display.println(mq135);
  display.print("Temp: ");
  display.print(temperature);
  display.println(" C");
  display.print("Hum: ");
  display.print(relative_humidity);
  display.println(" %");
  display.print("eCO2: ");
  display.print(eco2);
  display.println(" ppm");
  display.print("TVOC: ");
  display.print(tvoc);
  display.println(" ppb");
  display.print("AQI: ");
  display.println(aqi);

  display.display();
}


void publishSensorData(bool flameDetected, int flameIntensity, bool gasDetected, float co, float co2, float eco2, float tvoc, int aqi, float temperature, float relative_humidity) {
  StaticJsonDocument<512> doc;

  doc["flameDetected"] = flameDetected;
  doc["flameIntensity"] = flameIntensity;
  doc["gasDetected"] = gasDetected;
  doc["co"] = co;
  doc["co2"] = co2;

  
  doc["eco2"] = eco2;
  doc["tvoc"] = tvoc;
  doc["aqi"] = aqi;

  
  doc["temperature"] = temperature;
  doc["humidity"] = relative_humidity;

  char buffer[512];
  serializeJson(doc, buffer);
  client.publish(mqtt_topic, buffer);
}


void printSensorStatus(bool flameDetected, int flameIntensity, bool gasDetected, float co, float co2, float eco2, float tvoc, int aqi, float temperature, float relative_humidity) {

  Serial.println("==== Sensor Readings ====");

  Serial.print("🔥 Flame Detected: ");
  Serial.println(flameDetected ? "YES" : "NO");

  Serial.print("🔥 Flame Intensity: ");
  Serial.println(flameIntensity);

  Serial.print("🧪 Gas Detected (digital): ");
  Serial.println(gasDetected ? "YES" : "NO");

  Serial.print("🧪 CO PPM: ");
  Serial.println(co, 2);

  Serial.print("🧪 CO2 PPM: ");
  Serial.println(co2, 2);

  Serial.printf("eCO2: %d ppm | TVOC: %d ppb\n", eco2, tvoc);
  Serial.printf("Temperature: %.2f °C | Humidity: %.2f %%\n", temperature, relative_humidity);

  Serial.print("Air Quality Index (1-5) : ");
  Serial.println(aqi);


  Serial.println("==========================");

  updateDisplay(flameDetected, flameIntensity, gasDetected, co, co2, eco2, tvoc, aqi, temperature, relative_humidity);
}


void connectToWiFi() {
  WiFiManager wm;

  bool res = wm.autoConnect("ESP32-Roomy");

  if (!res) {
    Serial.println("⚠️ Failed to connect to WiFi and timed out.");
    ESP.restart();
  }

  Serial.println("✅ Connected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}



void setup() {
  setupSensors();
  connectToWiFi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  bool flameDetected = isFlameDetected();
  int flameIntensity = readFlameIntensity();

  bool gasDetected = isGasDetected();

  float co = readCOPPM();

  float co2 = readCO2PPM();

  


  int eco2 = -1, tvoc = -1, aqi = -1;
  if (ens160.checkDataStatus()) {
    eco2 = ens160.getECO2();
    tvoc = ens160.getTVOC();
    aqi = ens160.getAQI();
  } else {
    Serial.println("ENS160 data not available.");
  }

  sensors_event_t humidity, temp;

  aht21.getEvent(&humidity, &temp);


  printSensorStatus(flameDetected,flameIntensity, gasDetected, co, co2, eco2, tvoc,aqi, temp.temperature, humidity.relative_humidity);
  
  
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  publishSensorData(flameDetected,flameIntensity, gasDetected, co, co2, eco2, tvoc,aqi, temp.temperature, humidity.relative_humidity);


  delay(1000);
}
