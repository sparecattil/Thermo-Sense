#include <Arduino.h> 
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define WIFI_SSID "UI-DeviceNet"
#define WIFI_PASSWORD "UI-DeviceNet"
#define API_KEY "AIzaSyA6e2_8HoCuZyHfXt_HToq3FBO1MH2jUBE"
#define DATABASE_URL "https://thermostat-ed3d4-default-rtdb.firebaseio.com/"
#define SCREEN_WIDTH 128 
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
bool signupOK = false;
int powerStatus = 1;
float prevTempOneC = 0;
float prevTempOneF = 0;
float prevTempTwoC = 0;
float prevTempTwoF = 0;

bool sensorOneStatus;
bool sensorTwoStatus;

bool emailLockMinOne = false;
bool emailLockMaxOne = false;
bool emailLockMinTwo = false;
bool emailLockMaxTwo = false;
TaskHandle_t emailTaskHandle = NULL; // Handle for the email task
bool firstEmail = true;
bool test = true;

const int oneWireBus = 4; // GPIO pin for the DS18B20 sensor 

OneWire oneWire(oneWireBus); // Setting up a oneWire instance to communicate with any OneWire devices
DallasTemperature sensors(&oneWire); // Passing oneWire reference to Dallas Temperature sensor 
int numberOfDevices; // Number of temperature devices found
DeviceAddress tempDeviceAddress; // Current device address
DeviceAddress sensorOneAddress;
DeviceAddress sensorTwoAddress;

//To be Deleted
struct Button {
  const uint8_t PIN;
  uint32_t numberKeyPresses;
  bool pressed;
};

Button button1 = {18, 0, false};

void IRAM_ATTR isr() {
  button1.numberKeyPresses++;
  button1.pressed = true;
}
//To be Deleted


void setup() {
  Serial.begin(115200);

  //pinMode(button1.PIN, INPUT_PULLUP); //To be Deleted
  //attachInterrupt(button1.PIN, isr, FALLING); //To be Deleted

  tempSensorSetup(); // Sets up the temperature sensors

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-FI");
  while(WiFi.status() != WL_CONNECTED) {
    Serial.print("."); 
    delay(1000);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  if(Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("signUp OK");
    signupOK = true;
  }
  else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  
  Firebase.reconnectWiFi(true);

  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Don't proceed, loop forever
  }

  // Show initial display buffer contents on the screen --
  // the library initializes this with an Adafruit splash screen.
  display.display();
  delay(2000); // Pause for 2 seconds

  // Clear the buffer
  display.clearDisplay();
  readingDisplaySetup();

}

void loop() {
  sensors.requestTemperatures(); 
  //float temperatureC = sensors.getTempCByIndex(0);
  //float temperatureF = sensors.getTempFByIndex(0);
  float tempCSensorOne;
  float tempFSensorOne;
  float tempCSensorTwo;
  float tempFSensorTwo;

  // Check if sensor 1 is connected
  if (sensors.isConnected(sensorOneAddress)) {
    Serial.println("Reading Sensor 1");
    if (!sensorOneStatus) {
      //delay(1000);
    }
    sensorOneStatus = true;
    tempCSensorOne = round(sensors.getTempC(sensorOneAddress) * 100.0) / 100.0;
    tempFSensorOne = round(DallasTemperature::toFahrenheit(tempCSensorOne) * 100.0) / 100.0;
  } 
  else {
    Serial.println("Sensor 1 DISCONNECTED");
    if (sensorOneStatus) {
      tempCSensorOne = -999;
      tempFSensorOne = round(DallasTemperature::toFahrenheit(tempCSensorOne) * 100.0) / 100.0;
      sendToFirebase("Temp/Sensor_One/Celsius", tempCSensorOne);
      sendToFirebase("Temp/Sensor_One/Fahrenheit", tempFSensorOne);
    }
    sensorOneStatus = false;
  }

  Serial.print("Device 1 - ");
  Serial.print("Temp C: ");
  Serial.print(tempCSensorOne);
  Serial.print(" Temp F: ");
  Serial.println(tempFSensorOne);

  // Check if sensor 2 is connected
  if (sensors.isConnected(sensorTwoAddress)) {
    Serial.println("Reading Sensor 2");
    if (!sensorTwoStatus) {
      //delay(1000);
    }
    sensorTwoStatus = true;
    tempCSensorTwo = round(sensors.getTempC(sensorTwoAddress) * 100.0) / 100.0;
    tempFSensorTwo = round(DallasTemperature::toFahrenheit(tempCSensorTwo) * 100.0) / 100.0;
  } 
  else {
    Serial.println("Sensor 2 DISCONNECTED");
    if (sensorTwoStatus) {
      tempCSensorTwo = -999;
      tempFSensorTwo = round(DallasTemperature::toFahrenheit(tempCSensorTwo) * 100.0) / 100.0;
      sendToFirebase("Temp/Sensor_Two/Celsius", tempCSensorTwo);
      sendToFirebase("Temp/Sensor_Two/Fahrenheit", tempFSensorTwo);
    }
    sensorTwoStatus = false;
  }

  Serial.print("Device 2 - ");
  Serial.print("Temp C: ");
  Serial.print(tempCSensorTwo);
  Serial.print(" Temp F: ");
  Serial.println(tempFSensorTwo);

  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0)) {
    Serial.print("Firebase - Previous One : ");
    Serial.print(prevTempOneC);
    Serial.print(" Current One:  ");
    Serial.println(tempCSensorOne);
    //&& (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0)
    sendDataPrevMillis = millis();
    if (prevTempOneC != tempCSensorOne) {
      Serial.print("Sending data for Sensor 1 - C: ");
      Serial.print(tempCSensorOne);
      Serial.print(" F: ");
      Serial.println(tempCSensorOne);

      sendToFirebase("Temp/Sensor_One/Celsius", tempCSensorOne);
      sendToFirebase("Temp/Sensor_One/Fahrenheit", tempFSensorOne);
    }
    Serial.print("Firebase - Previous Two : ");
    Serial.print(prevTempTwoC);
    Serial.print(" Current Two:  ");
    Serial.println(tempCSensorTwo);
    if (prevTempTwoC != tempCSensorTwo) {
      Serial.print("Sending data for Sensor 2 - C: ");
      Serial.print(tempCSensorTwo);
      Serial.print(" F: ");
      Serial.println(tempCSensorTwo);
      sendToFirebase("Temp/Sensor_Two/Celsius", tempCSensorTwo);
      sendToFirebase("Temp/Sensor_Two/Fahrenheit", tempFSensorTwo);
    }
    //sendToFirebase("Power_Status", powerStatus);
  }
  //delay(1000);
  sensorOneDisplay(tempCSensorOne);
  sensorTwoDisplay(tempCSensorTwo);


  //readFromFirebaseFloat("Threshold/Sensor_One/Max/Celsius", tempCSensorOne, tempCSensorTwo);
  /*
  if (button1.pressed) {
    Serial.printf("Button has been pressed %u times\n", button1.numberKeyPresses);
    button1.pressed = false;
    sendEmail();
  }
  */
  
  //delay(1000);
}

void sendToFirebase(String path, float value) {
  if (Firebase.RTDB.setFloat(&fbdo, path, value)) {
      Serial.println(); 
      Serial.print(value);
      Serial.print("- successfully saved to: " + fbdo.dataPath());
      Serial.println(" (" + fbdo.dataType() + ")");
  }
  else {
    Serial.println("FAILED: " + fbdo.errorReason());
  }
}

void readFromFirebaseFloat(String path, float currentOneC, float currentTwoC) {
  if (Firebase.RTDB.getFloat(&fbdo, path)) {
    
  }
  else {
    Serial.println("FAILED: " + fbdo.errorReason());
  }
}


///* To be Deleted
// function to print a device address
void printAddress(DeviceAddress deviceAddress) {
  for (uint8_t i = 0; i < 8; i++){
    if (deviceAddress[i] < 16) Serial.print("0");
      Serial.print(deviceAddress[i], HEX);
  }
}
// To be Deleted
//*/

// Sets up the two DS18B20 temperature sensors
void tempSensorSetup() {
  sensors.begin(); // Initializing communication with the sensor on the OneWire bus

  numberOfDevices = sensors.getDeviceCount(); // Grabbing a count of devices on the wire
  
  Serial.print(numberOfDevices, DEC);
  Serial.println(" devices have been found");

  if (numberOfDevices > 0) {
    sensors.getAddress(sensorOneAddress, 0);
  }

  if (numberOfDevices > 1) {
    sensors.getAddress(sensorTwoAddress, 1);
  }

  /* To be Deleted
  // Loop through each device, print out address
  for(int i=0; i < numberOfDevices; i++) {
    // Search the wire for address
    if(sensors.getAddress(tempDeviceAddress, i)) {
      Serial.print("Found device ");
      Serial.print(i, DEC);
      Serial.print(" with address: ");
      printAddress(tempDeviceAddress);
      Serial.println();
    } 
    else {
      Serial.print("Found ghost device at ");
      Serial.print(i, DEC);
      Serial.print(" but could not detect address. Check power and cabling");
    }
  }
  // To be Deleted
  */ 
}
///////////////////////////////////////////////////////////////////////////////////////
// Method : readingDisplaySetup()
// Sets up the template for the oled display, template can be found below
// Title - "Readings"
// Line 1 for Sensor 1 - "S1" + temperatureS1 + "C"
// Line 1 for Sensor 2 - "S2" + temperatureS2 + "C"
// Functionality to potential add: Add degrees sign before the "C"
///////////////////////////////////////////////////////////////////////////////////////
void readingDisplaySetup() {
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  // Writes "Readings" for for the title to the display
  display.setCursor(18, 0);    
  display.print("Readings");
  // Writes "S1" for sensor 1 to the display
  display.setCursor(0,20);
  display.print("S1:");
  // Writes "C" to be display after the temperature for sensor 1
  display.setCursor(110,20);
  display.print("C");
  // Writes "S2" for sensor 2 to the display
  display.setCursor(0,42);
  display.print("S2:");
  // Writes "C" to be display after the temperature for sensor 2
  display.setCursor(110,42);
  display.print("C");
  display.display(); // Display to the screen
}

// 
void sensorOneDisplay(float temp) {
  clearSensorOneTempC();
  display.setTextSize(2);     
  display.setTextColor(SSD1306_WHITE); 
  display.setCursor(34, 20);
  if (temp != -999.00) {
    display.print(temp);
  }
  else {
    display.print("DISC");
  }
  display.display();
  prevTempOneC = temp;
}

void sensorTwoDisplay(float temp) {
  clearSensorTwoTempC();
  display.setTextSize(2);     
  display.setTextColor(SSD1306_WHITE); 
  display.setCursor(34, 42);
  if (temp != -999.00) {
    display.print(temp);
  }
  else {
    display.print("DISC");
  }
  display.display();
  prevTempTwoC = temp;
}

void clearSensorOneTempC() {
  display.setCursor(34,20);
  display.setTextColor(SSD1306_BLACK);
  if (prevTempOneC != -999.00) {
    display.print(prevTempOneC);
  }
  else {
    display.print("DISC");
  }
}

void clearSensorTwoTempC() {
  display.setCursor(34,42);
  display.setTextColor(SSD1306_BLACK);
  if (prevTempTwoC != -999.00) {
    display.print(prevTempTwoC);
  }
  else {
    display.print("DISC");
  }
}
