#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = ""; // WiFi pavadinimas
const char* password = ""; // WiFi slaptažodis
const char* serverName = "http://localhost:5000/api";

const int id = 4;
const int soundAnalogPin = A0;
const int soundDigitalPin = 3;
const int vibrationPin = 16;
const int buzzerPin = 4;
int buzzerSound = 1;
String machineStatus = "undefined";
int statusCounter = 0;
int sendStatus = 0;
const int soundBufferSize = 5;
int soundBuffer[soundBufferSize] = {0};
int soundIndex = 0;

void setup() {
  Serial.begin(9600);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Jungiamasi prie WiFi...");
  }
  Serial.println("WiFi prisijungta!");

  pinMode(buzzerPin, OUTPUT);
  pinMode(soundDigitalPin, INPUT);
  pinMode(vibrationPin, INPUT);


  randomSeed(analogRead(0));
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {

    int vibrationValue = digitalRead(vibrationPin);
    int soundAnalogValue = analogRead(soundAnalogPin);
    int soundDigitalValue = digitalRead(soundDigitalPin);

    soundBuffer[soundIndex] = soundAnalogValue;
    soundIndex = (soundIndex + 1) % soundBufferSize;

    // Garso jutiklio duomenų vidurkio skaičiavimas
    int soundSum = 0;
    for (int i = 0; i < soundBufferSize; i++) {
      soundSum += soundBuffer[i];
    }
    int avgSoundValue = soundSum / soundBufferSize;
  
    Serial.print("Vibracija: ");
    Serial.print(vibrationValue);
    Serial.print(" | Garso vidurkis: ");
    Serial.println(avgSoundValue);

    if (vibrationValue == 0 || avgSoundValue < 200) {
      statusCounter++;
    } else {
      if (sendStatus < 3)
        sendStatus++;
      statusCounter = 0;
      machineStatus = "Užimta";
      buzzerSound = 0;
    }

    Serial.print("Status Counter: ");
    Serial.print(statusCounter);
    Serial.print(" | Send Status: ");
    Serial.print(sendStatus);
    Serial.print(" | Machine status: ");
    Serial.print(machineStatus);
    Serial.print(" | Buzzer: ");
    Serial.println(buzzerSound);

    if (statusCounter >= 20 && buzzerSound == 0) {
      playTheSignal();
      buzzerSound = 1;
      
      statusCounter = 0;
      sendStatus = 0;
      
      machineStatus = "Laisva";
      sendMachineStatus(id, machineStatus, serverName);
    }

    if (sendStatus == 1) {
      sendMachineStatus(id, machineStatus, serverName);
    }
  } else {
    Serial.println("WiFi ryšio nėra");
  }

  delay(500); 
}

void sendMachineStatus(int id, String machineStatus, String serverName) {
  WiFiClient client;
  HTTPClient http;
  http.begin(client, serverName);
  http.addHeader("Content-Type", "application/json");
  String jsonData = "{\"deviceId\":" + String(id) + ",\"status\":\"" + machineStatus + "\"}";
  Serial.print("jsonData to server: ");
  Serial.println(jsonData);
  int httpResponseCode = http.POST(jsonData);
  Serial.print("Serverio atsakymas: ");
  Serial.println(httpResponseCode);
  http.end();
}

void playTheSignal() {
  digitalWrite(buzzerPin,HIGH);
  delay(2000);
  digitalWrite(buzzerPin, LOW);  // Išjungiame buzzer'į
}
