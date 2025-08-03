#include <WiFi.h>
#include <WiFiManager.h>
#include <Adafruit_AHTX0.h>
#include <SparkFun_ENS160.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

// display setup
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);


// MQTT setup
WiFiClient espClient;
PubSubClient client(espClient);


// pin setup
const int IR_digitalPin = 27;
const int IR_analogPin = 34;
const int MQ9_digitalPin = 14;
const int MQ9_analogPin = 35;
const int MQ135_analogPin = 32;
const int Buzzer_digitalPin = 33;

Adafruit_AHTX0 aht21;
SparkFun_ENS160 ens160;



//================================================================================================================================================


// --------- MQ-9 setup ----------------- //

// MQ-9 calibration values according to documentation
const float MQ9_cleanAirResistance = 10.0;  // resistence in clean air (kohm)
const float MQ9_Ro = 10.0;                  // base resistance in clean air

// approximate sensitivity factors
#define MQ9_CO_SLOPE -0.77
#define MQ9_CO_INTERCEPT 1.699

#define MQ9_LPG_SLOPE -0.47
#define MQ9_LPG_INTERCEPT 1.289

#define MQ9_CH4_SLOPE -0.38
#define MQ9_CH4_INTERCEPT 1.134

// ------------------------------------------ //
// ------------------------------------------ //

// --------- MQ-135 setup ----------------- //

// MQ-135 calibration values according to documentation
const float MQ135_cleanAirResistance = 10.0;  // resistence in clean air (kohm)
const float MQ135_Ro = 76.63;                 // base resistance in clean air

// approximate sensitivity factors
struct GasCurve {
  float a;
  float b;
};

GasCurve MQ135_curves[] = {
  { 110.47, -2.862 },  // CO2
  { 102.2, -2.473 },   // NH3
  { 77.255, -3.18 },   // Alcohol
  { 44.947, -3.445 },  // Benzene
  { 220.13, -2.91 },   // NOx
  { 141.72, -2.92 },   // Toluene
  { 109.7, -2.94 }     // Acetone
};

// ------------------------------------------ //
// ------------------------------------------ //



// --------- AHT-21 setup ----------------- //

// dew point constants
const float AHT21_A = 17.27;
const float AHT21_B = 237.7;


// ------------------------------------------ //
// ------------------------------------------ //


// --------- MQTT setup ----------------- //

const char* mqtt_server = "192.168.8.104";
const int mqtt_port = 1883;
const char* mqtt_topic_aht21 = "sensor/data/aht21";
const char* mqtt_topic_ens160 = "sensor/data/ens160";
const char* mqtt_topic_mq9 = "sensor/data/mq9";
const char* mqtt_topic_mq135 = "sensor/data/mq135";
const char* mqtt_topic_temp = "sensor/data/temp";


// ------------------------------------------ //
// ------------------------------------------ //



//================================================================================================================================================

struct MQ9_Readings {
  float co_ppm;
  float lpg_ppm;
  float ch4_ppm;
};

struct MQ135_Readings {
  float co2;
  float nh3;
  float alcohol;
  float benzene;
  float nox;
  float toluene;
  float acetone;
};


struct AHT21_Readings {
  float temperature;
  float humidity;
  float dewPoint;
  float heatIndex;
  float absoluteHumidity;
};


struct ENS160_Readings {
  uint16_t tvoc;
  uint16_t eco2;
  uint8_t aqi;
};


// --------- MQ-9 sensor readings ----------------- //

float MQ9_readSensorRatio() {
  int raw = analogRead(MQ9_analogPin);
  float voltage = raw / 4095.0 * 3.3;
  float Rs = (3.3 - voltage) / voltage * MQ9_cleanAirResistance;
  return Rs / MQ9_Ro;
}

float MQ9_calculatePPM(float slope, float intercept) {
  float ratio = MQ9_readSensorRatio();
  return pow(10, (log10(ratio) - intercept) / slope);
}

MQ9_Readings MQ9_getReadings() {
  MQ9_Readings readings;
  readings.co_ppm = MQ9_calculatePPM(MQ9_CO_SLOPE, MQ9_CO_INTERCEPT);
  readings.lpg_ppm = MQ9_calculatePPM(MQ9_LPG_SLOPE, MQ9_LPG_INTERCEPT);
  readings.ch4_ppm = MQ9_calculatePPM(MQ9_CH4_SLOPE, MQ9_CH4_INTERCEPT);
  return readings;
}


// ------------------------------------------ //
// ------------------------------------------ //



// --------- MQ-135 sensor readings ----------------- //

float MQ135_readSensorRatio() {
  int raw = analogRead(MQ135_analogPin);
  float voltage = raw / 4095.0 * 3.3;
  float Rs = (3.3 - voltage) / voltage * MQ135_cleanAirResistance;
  return Rs / MQ135_Ro;
}



MQ135_Readings MQ135_getReadings() {
  MQ135_Readings readings;
  float ratio = MQ135_readSensorRatio();
  readings.co2 = MQ135_curves[0].a * pow(ratio, MQ135_curves[0].b);
  readings.nh3 = MQ135_curves[1].a * pow(ratio, MQ135_curves[1].b);
  readings.alcohol = MQ135_curves[2].a * pow(ratio, MQ135_curves[2].b);
  readings.benzene = MQ135_curves[3].a * pow(ratio, MQ135_curves[3].b);
  readings.nox = MQ135_curves[4].a * pow(ratio, MQ135_curves[4].b);
  readings.toluene = MQ135_curves[5].a * pow(ratio, MQ135_curves[5].b);
  readings.acetone = MQ135_curves[6].a * pow(ratio, MQ135_curves[6].b);
  return readings;
}


// ------------------------------------------ //
// ------------------------------------------ //

// --------- AHT-21 sensor readings ----------------- //

float AHT21_calculateDewPoint(float t, float h) {
  float alpha = ((AHT21_A * t) / (AHT21_B + t)) + log(h / 100.0);
  return (AHT21_B * alpha) / (AHT21_A - alpha);
}


float AHT21_computeHeatIndex(float temperature, float humidity, bool isFahrenheit = false) {
  if (!isFahrenheit) {
    temperature = temperature * 9 / 5 + 32;
  }

  float hi = -42.379 + 2.04901523 * temperature + 10.14333127 * humidity
             - 0.22475541 * temperature * humidity - 0.00683783 * pow(temperature, 2)
             - 0.05481717 * pow(humidity, 2) + 0.00122874 * pow(temperature, 2) * humidity
             + 0.00085282 * temperature * pow(humidity, 2)
             - 0.00000199 * pow(temperature, 2) * pow(humidity, 2);

  return isFahrenheit ? hi : (hi - 32) * 5 / 9;
}

float AHT21_calculateAbsoluteHumidity(float tempC, float RH) {
  return (6.112 * exp((17.67 * tempC) / (tempC + 243.5)) * RH * 2.1674) / (273.15 + tempC);
}


AHT21_Readings AHT21_getReadings() {
  sensors_event_t humidity, temp;
  aht21.getEvent(&humidity, &temp);

  float t = temp.temperature;
  float h = humidity.relative_humidity;
  float dew = AHT21_calculateDewPoint(t, h);
  float hi = AHT21_computeHeatIndex(t, h);
  float absHum = AHT21_calculateAbsoluteHumidity(t, h);

  return { t, h, dew, hi, absHum };
}


// ------------------------------------------ //
// ------------------------------------------ //


// --------- ENS-160 sensor readings ----------------- //

ENS160_Readings ENS160_getReadings() {
  ENS160_Readings readings;

  readings.tvoc = -1;
  readings.eco2 = -1;
  readings.aqi = -1;

  if (ens160.checkDataStatus()) {
    readings.eco2 = ens160.getECO2();
    readings.tvoc = ens160.getTVOC();
    readings.aqi = ens160.getAQI();
  } else {
    Serial.println("ENS160 data not available.");
  }

  return readings;
}




// ------------------------------------------ //
// ------------------------------------------ //

//================================================================================================================================================




// --------- MQTT Reconnection ----------------- //

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

// ------------------------------------------ //
// ------------------------------------------ //


// --------- Sensor Setup ----------------- //

void setupSensors() {
  Serial.begin(115200);
  pinMode(IR_digitalPin, INPUT);
  pinMode(MQ9_digitalPin, INPUT);
  pinMode(Buzzer_digitalPin, OUTPUT);
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
  digitalWrite(Buzzer_digitalPin, LOW);
}


// ------------------------------------------ //
// ------------------------------------------ //


// --------- Display Setup ----------------- //


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



// ------------------------------------------ //
// ------------------------------------------ //


// --------- WiFi Setup ----------------- //

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



// ------------------------------------------ //
// ------------------------------------------ //

bool isFlameDetected() {
  return digitalRead(IR_digitalPin) == LOW;
}


int readFlameIntensity() {
  return analogRead(IR_analogPin);
}


bool isGasDetected() {
  return digitalRead(MQ9_digitalPin) == LOW;
}

void updateDisplay(AHT21_Readings aht21,
                   ENS160_Readings ens160,
                   MQ9_Readings mq9,
                   MQ135_Readings mq135,
                   bool flameDetected) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);

  display.println("Sensor Data:");

  display.printf("T:%.1fC H:%.0f%% D:%.1f ", aht21.temperature, aht21.humidity, aht21.dewPoint);
  display.printf("HI:%.1f AH:%.1f\n", aht21.heatIndex, aht21.absoluteHumidity);

  display.printf("AQI:%d CO2:%.4f TVOC:%.4d ", ens160.aqi, ens160.eco2, ens160.tvoc);

  display.printf("CO:%.1f CH4:%.1f LPG:%.1f ", mq9.co_ppm, mq9.ch4_ppm, mq9.lpg_ppm);

  display.printf("NH3:%.1f Alc:%.1f Benz:%.1f ", mq135.nh3, mq135.alcohol, mq135.benzene);

  display.printf("Tol:%.1f Ace:%.1f ", mq135.toluene, mq135.acetone);

  display.printf("Flame:%s ", flameDetected ? "YES" : "NO");

  display.display();
}


void publishSensorData(AHT21_Readings aht21,
                       ENS160_Readings ens160,
                       MQ9_Readings mq9,
                       MQ135_Readings mq135,
                       bool flameDigital,
                       int flameAnalog) {
  StaticJsonDocument<512> docTemp;
  StaticJsonDocument<512> docAHT21;
  StaticJsonDocument<512> docMQ9;
  StaticJsonDocument<512> docMQ135;
  StaticJsonDocument<512> docENS160;

  // AHT21 readings
  docAHT21["temperature"] = aht21.temperature;
  docAHT21["humidity"] = aht21.humidity;

  // ENS160 readings
  docENS160["aqi"] = ens160.aqi;
  docENS160["eco2"] = ens160.eco2;
  docENS160["tvoc"] = ens160.tvoc;

  // // MQ-9 readings
  docMQ9["co_ppm"] = mq9.co_ppm;
  docMQ9["ch4_ppm"] = mq9.ch4_ppm;
  docMQ9["lpg_ppm"] = mq9.lpg_ppm;

  // // MQ-135 readings
  // docMQ135["nh3"] = mq135.nh3;
  docMQ135["co2"] = mq135.co2;
  docMQ135["alcohol"] = mq135.alcohol;
  docMQ135["toluene"] = mq135.toluene;
  docMQ135["acetone"] = mq135.acetone;

  // // Flame sensor
  docTemp["flame_detected"] = flameDigital;
  docTemp["flame_intensity"] = flameAnalog;


  char bufferAHT21[512];
  char bufferENS160[512];
  char bufferMQ9[512];
  char bufferMQ135[512];
  char bufferTemp[512];

  serializeJson(docAHT21, bufferAHT21);
  serializeJson(docENS160, bufferENS160);
  serializeJson(docMQ9, bufferMQ9);
  serializeJson(docMQ135, bufferMQ135);
  serializeJson(docTemp, bufferTemp);

  bool resultAHT21 = client.publish(mqtt_topic_aht21, bufferAHT21);
  bool resultENS160 = client.publish(mqtt_topic_ens160, bufferENS160);
  bool resultMQ9 = client.publish(mqtt_topic_mq9, bufferMQ9);
  bool resultMQ135 = client.publish(mqtt_topic_mq135, bufferMQ135);
  bool resultTemp = client.publish(mqtt_topic_temp, bufferTemp);

  
}


void printSensorStatus(AHT21_Readings aht21,
                       ENS160_Readings ens160,
                       MQ9_Readings mq9,
                       MQ135_Readings mq135,
                       bool flameDigital,
                       int flameAnalog) {
  Serial.println(F("==================================="));
  Serial.println(F("          🔍 Sensor Status         "));
  Serial.println(F("==================================="));

  // AHT21
  Serial.println(F("🌡️  AHT21 Sensor"));
  Serial.print(F("  - Temperature: "));
  Serial.print(aht21.temperature, 1);
  Serial.println(F(" °C"));

  Serial.print(F("  - Humidity:    "));
  Serial.print(aht21.humidity, 1);
  Serial.println(F(" %"));

  // ENS160
  Serial.println(F("\n🌫️  ENS160 Air Quality Sensor"));
  Serial.print(F("  - AQI:         "));
  Serial.println(ens160.aqi);

  Serial.print(F("  - eCO2:        "));
  Serial.print(ens160.eco2);
  Serial.println(F(" ppm"));

  Serial.print(F("  - TVOC:        "));
  Serial.print(ens160.tvoc);
  Serial.println(F(" ppb"));

  // MQ-9
  Serial.println(F("\n🧪 MQ-9 Gas Sensor"));
  Serial.print(F("  - CO:          "));
  Serial.print(mq9.co_ppm, 2);
  Serial.println(F(" ppm"));

  Serial.print(F("  - CH4:         "));
  Serial.print(mq9.ch4_ppm, 2);
  Serial.println(F(" ppm"));

  Serial.print(F("  - LPG:         "));
  Serial.print(mq9.lpg_ppm, 2);
  Serial.println(F(" ppm"));

  // MQ-135
  Serial.println(F("\n🧪 MQ-135 Gas Sensor"));
  Serial.print(F("  - NH3:         "));
  Serial.print(mq135.nh3, 2);
  Serial.println(F(" ppm"));

  Serial.print(F("  - CO2:         "));
  Serial.print(mq135.co2, 2);
  Serial.println(F(" ppm"));

  Serial.print(F("  - Alcohol:     "));
  Serial.print(mq135.alcohol, 2);
  Serial.println(F(" ppm"));

  Serial.print(F("  - Toluene:     "));
  Serial.print(mq135.toluene, 2);
  Serial.println(F(" ppm"));

  Serial.print(F("  - Acetone:     "));
  Serial.print(mq135.acetone, 2);
  Serial.println(F(" ppm"));

  // Flame sensor
  Serial.println(F("\n🔥 IR Flame Sensor"));
  Serial.print(F("  - Flame Detected: "));
  Serial.println(flameDigital ? F("YES") : F("NO"));

  Serial.print(F("  - Analog Value:   "));
  Serial.println(flameAnalog);

  Serial.println(F("===================================\n"));
}






void setup() {
  setupSensors();
  connectToWiFi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  bool flameDetected = isFlameDetected();
  int flameIntensity = readFlameIntensity();


  MQ9_Readings mq9_data = MQ9_getReadings();

  MQ135_Readings mq135_data = MQ135_getReadings();

  AHT21_Readings aht21_data = AHT21_getReadings();

  ENS160_Readings ens160_data = ENS160_getReadings();

  updateDisplay(aht21_data, ens160_data, mq9_data, mq135_data, flameDetected);

  printSensorStatus(aht21_data, ens160_data, mq9_data, mq135_data, flameDetected, flameIntensity);


  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  publishSensorData(aht21_data,
                    ens160_data,
                    mq9_data,
                    mq135_data,
                    flameDetected,
                    flameIntensity);


  if (flameDetected) {
    digitalWrite(Buzzer_digitalPin, HIGH);
  } else {
    digitalWrite(Buzzer_digitalPin, LOW);
  }


  delay(5000);
}
