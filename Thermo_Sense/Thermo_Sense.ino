///////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////<THERMO SENSE>////////////////////////////////////
// Group Members: Sebastian Parecatti, Shiv Patel, John Finch, Logan Schimanski
// Description: 
// Contains software implementations for the hardware contained in the third box
// This file is designed for an esp32 microcontroller
// Gets temperature readings from two DS18B20 temperture sensors
// Temperature reading in Celsius and Fahrenheit are sent to Firebase
// Displays the temperatures of each sensor to a SS1306 OLED display in Celsius
// Sensors On/Off is controlled by attributes on Firebase which are set by two buttons
// on the third box, If the sensors are turned off from the web client, the esp32 will
// read and detect the changes from Firebase to turn the respective sensor On/Off
/////////////////////////////////////<THERMO SENSE>////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////<GLOBAL VARIABLES>//////////////////////////////////

FirebaseData fbdo, fbdo_one, fbdo_two; // Firebase data objects for sending and receiving data from Firebase
                                       // fbdo - sending temperature data and power status to firebase
                                       // fbdo_one - sending and receiving On/Off status of sensor one
                                       // fbdo_two - sending and receiving On/Off status of sensor two
FirebaseAuth auth; // Used for authentication to Firebase
FirebaseConfig config; // Used to set the configure properties of the connection to Firebase

unsigned long sendDataPrevMillis = 0; // Used to find the time elapsed since the data was last sent to Firebase
bool signupOK = false; // Signed into firebase check
int powerStatus = 1; // Variable constantly fluctuates between 0(False) and 1(True) to indicate the device is on

float prevTempOneC = 0; // Holds the prev temperature reading for sensor one
float prevTempTwoC = 0; // Holds the prev temperature reading for sensor two

bool sensorOneStatus; // Handles the single execution of the tasks for sensor one disconnection
bool sensorTwoStatus; // Handles the single execution of the tasks for sensor two disconnection

String onStatusOne; // On/Off status of sensor one
String onStatusTwo; // On/Off status of sensor two

const int oneWireBus = 4; // Pin for the DS18B20 sensor 

OneWire oneWire(oneWireBus); // Setting up a oneWire instance to communicate with any OneWire devices
DallasTemperature sensors(&oneWire); // Passing oneWire reference to Dallas Temperature sensor 
int numberOfDevices; // Number of temperature devices found
DeviceAddress sensorOneAddress; // Address of sensor one
DeviceAddress sensorTwoAddress; // Address of sensor two

float tempCSensorOne; // Current sensor one temperature in Celsius
float tempFSensorOne; // Current sensor one temperature in Fahrenheit
float tempCSensorTwo; // Current sensor two temperature in Celsius
float tempFSensorTwo; // Current sensor two temperature in Fahrenheit

struct Button {
  const uint8_t PIN; // Pin for a button
  bool pressed; // Checks if the button is pressed
};

Button button1 = {18, false}; // Pin 18, False - Button is not pressed
Button button2 = {19, false}; // Pin 19, False - Button is not pressed

///////////////////////////////////<GLOBAL VARIABLES>//////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
// ISR : isrButton1()
// Interrupt Service Routine for sensor one button
// Sets pressed attribute of button one when the button is pressed
///////////////////////////////////////////////////////////////////////////////////////
void IRAM_ATTR isrButton1() {
  button1.pressed = true;
}

///////////////////////////////////////////////////////////////////////////////////////
// ISR : isrButton2()
// Interrupt Service Routine for sensor two button
// Sets pressed attribute of button two when the button is pressed
///////////////////////////////////////////////////////////////////////////////////////
void IRAM_ATTR isrButton2() {
  button2.pressed = true;
}

void setup() {
  Serial.begin(115200);

  //----Button setup----//
  pinMode(button1.PIN, INPUT_PULLUP);
  pinMode(button2.PIN, INPUT_PULLUP);
  attachInterrupt(button1.PIN, isrButton1, FALLING); // Isr triggers on a falling edge for button 1
  attachInterrupt(button2.PIN, isrButton2, FALLING); // Isr triggers on a falling edge for button 2

  ////--------Temperature Sensor Setup--------////
  sensors.begin(); // Initializing communication with the sensor on the OneWire bus

  numberOfDevices = sensors.getDeviceCount(); // Grabbing a count of devices on the wire
  
  Serial.print(numberOfDevices, DEC);
  Serial.println(" devices have been found");

  if (numberOfDevices > 0) {
    sensors.getAddress(sensorOneAddress, 0); // Saving device 0's address locally
  }

  if (numberOfDevices > 1) {
    sensors.getAddress(sensorTwoAddress, 1); // Saving device 1's address locally
  }

  ////--------WIFI Setup--------////
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD); // Begin connection to WIFI
  Serial.print("Connecting to Wi-FI");
  // Loop until connect to the WIFI
  while(WiFi.status() != WL_CONNECTED) {
    Serial.print("."); 
    delay(1000);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  ////--------Firebase Setup--------////
  config.api_key = API_KEY; // Configuring the api key to the access Firebase
  config.database_url = DATABASE_URL; // Configuring the URL of the database
  // Signing up to Firebase
  if(Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("signUp OK");
    signupOK = true; // Successful sign up to Firebase
  }
  else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback; // Callback function to monitor the status of the Firebase authentication token
  Firebase.begin(&config, &auth); // Initializes Firebase with the configuration and authentication details
  
  Firebase.reconnectWiFi(true); // Configures Firebase to reconnect to WIFI when connection is lost

  // Starting stream for sensor one On/Off status
  if (!Firebase.RTDB.beginStream(&fbdo_one, "/Sensors/Sensor_One")) {
    Serial.printf("stream 1 begin error, %s\n\n", fbdo_one.errorReason().c_str());
  }

  // Starting stream for sensor two On/Off status
  if (!Firebase.RTDB.beginStream(&fbdo_two, "/Sensors/Sensor_Two")) {
    Serial.printf("stream 2 begin error, %s\n\n", fbdo_two.errorReason().c_str());
  }

  ////--------OLED Display Setup--------////
  // Initializing the OLED display 
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }

  display.clearDisplay(); //Clearing the entire display

  readingDisplaySetup(); // Setting the initial view to display temperature readings

}

void loop() {
  ////--------Reading Temperatures--------////
  sensors.requestTemperatures(); // Requesting the current temperture of the two sensors

  // Checking if sensor one is connected using its address
  if (sensors.isConnected(sensorOneAddress)) {
    Serial.println("Reading Sensor 1");
    sensorOneStatus = true; // Allowing next disconnect to send data to Firebase
    tempCSensorOne = round(sensors.getTempC(sensorOneAddress) * 100.0) / 100.0; // Getting the temperature in Celsius for sensor one
    tempFSensorOne = round(DallasTemperature::toFahrenheit(tempCSensorOne) * 100.0) / 100.0; // Getting the temperature in Fahrenheit for sensor one
  } 
  else {
    Serial.println("Sensor 1 DISCONNECTED");
    // One time disconnect indication to Firebase, sensorOneStatus is used to make sure that data is only sent once to Firebase
    if (sensorOneStatus) {
      tempCSensorOne = -999; // Key number in celsius for sensor disconnect
      tempFSensorOne = round(DallasTemperature::toFahrenheit(tempCSensorOne) * 100.0) / 100.0; // Calculating Fahrenheit conversion of the key number
      sendToFirebase("Temp/Sensor_One/Celsius", tempCSensorOne); // Sending key number in Celsius to Firebase for sensor one
      sendToFirebase("Temp/Sensor_One/Fahrenheit", tempFSensorOne); // Sending key number in Fahrenheit to Firebase for sensor one
    }
    sensorOneStatus = false;
  }

  Serial.print("Device 1 - ");
  Serial.print("Temp C: ");
  Serial.print(tempCSensorOne);
  Serial.print(" Temp F: ");
  Serial.println(tempFSensorOne);

  // Checking if sensor 2 is connected using its address
  if (sensors.isConnected(sensorTwoAddress)) {
    Serial.println("Reading Sensor 2");
    sensorTwoStatus = true; // Allowing next disconnect to send data to Firebase
    tempCSensorTwo = round(sensors.getTempC(sensorTwoAddress) * 100.0) / 100.0; // Getting the temperature in Celsius for sensor two
    tempFSensorTwo = round(DallasTemperature::toFahrenheit(tempCSensorTwo) * 100.0) / 100.0; // Getting the temperature in Fahrenheit for sensor two
  } 
  else {
    Serial.println("Sensor 2 DISCONNECTED");
    // One time disconnect indication to Firebase, sensorTwoStatus is used to make sure that data is only sent once to Firebase
    if (sensorTwoStatus) {
      tempCSensorTwo = -999; // Key number in celsius for sensor disconnect
      tempFSensorTwo = round(DallasTemperature::toFahrenheit(tempCSensorTwo) * 100.0) / 100.0; // Calculating Fahrenheit conversion of the key number
      sendToFirebase("Temp/Sensor_Two/Celsius", tempCSensorTwo); // Sending key number in Celsius to Firebase for sensor two
      sendToFirebase("Temp/Sensor_Two/Fahrenheit", tempFSensorTwo); // Sending key number in Fahrenheit to Firebase for sensor two
    }
    sensorTwoStatus = false;
  }

  Serial.print("Device 2 - ");
  Serial.print("Temp C: ");
  Serial.print(tempCSensorTwo);
  Serial.print(" Temp F: ");
  Serial.println(tempFSensorTwo);

  ////--------Sending to Firebase--------////
  // Checking to make sure that the connection to Firebase is setup
  // Temperature readings are sent to Firebase every one second
  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis(); // Current time since start of program

    // Sending temperature readings for sensor one to Firebase only when the reading changes
    if (prevTempOneC != tempCSensorOne) {
      Serial.print("Sending data for Sensor 1 - C: ");
      Serial.print(tempCSensorOne);
      Serial.print(" F: ");
      Serial.println(tempCSensorOne);

      sendToFirebase("Temp/Sensor_One/Celsius", tempCSensorOne); // Sending temperture in Celsius for sensor one to Firebase
      sendToFirebase("Temp/Sensor_One/Fahrenheit", tempFSensorOne); // Sending temperture in Fahrenheit for sensor one to Firebase
    }
    Serial.print("Firebase - Previous Two : ");
    Serial.print(prevTempTwoC);
    Serial.print(" Current Two:  ");
    Serial.println(tempCSensorTwo);

    // Sending temperature readings for sensor two only when the reading changes
    if (prevTempTwoC != tempCSensorTwo) {
      Serial.print("Sending data for Sensor 2 - C: ");
      Serial.print(tempCSensorTwo);
      Serial.print(" F: ");
      Serial.println(tempCSensorTwo);
      sendToFirebase("Temp/Sensor_Two/Celsius", tempCSensorTwo); // Sending temperture in Celsius for sensor two to Firebase
      sendToFirebase("Temp/Sensor_Two/Fahrenheit", tempFSensorTwo); // Sending temperture in Fahrenheit for sensor two to Firebase
    }

    // Fluctuating power status between 0(False) and 1(True) indicate that the third box is operating
    if (!powerStatus) {
      powerStatus = true;
    }
    else {
      powerStatus = false;
    }
    sendToFirebase("Power_Status", powerStatus); // Sending the power status to Firebase
  }
  
  ////--------Button Actions--------////
  // Toggles the status of sensor one when pressing button one
  // Checks if sensor one's button is pressed
  if (button1.pressed) {
    // Checks if the status of sensor one is Active from Firebase
    if (readFromFirebaseString("Sensors/Sensor_One")) {
      sendToFirebaseString("Sensors/Sensor_One", "Off"); // Changes the status of sensor one in Firebase to Off
    }
    else {
      sendToFirebaseString("Sensors/Sensor_One","Active"); // Changes the status of sensor one in Firebase to Active
    }
    button1.pressed = false;
  }

  // Toggles the status of sensor two when pressing button two
  // Checks if sensor two's button is pressed
  if (button2.pressed) {
    // Checks if the status of sensor two is Active from Firebase
    if (readFromFirebaseString("Sensors/Sensor_Two")) {
      sendToFirebaseString("Sensors/Sensor_Two", "Off"); // Changes the status of sensor two in Firebase to Off
    }
    else {
      sendToFirebaseString("Sensors/Sensor_Two","Active"); // Changes the status of sensor two in Firebase to Active
    }   
    button2.pressed = false;
  }


  // Updating the status of each sensor when it is changed in Firebase
  // Checking to make sure that the connection to Firebase is setup
  if (Firebase.ready() && signupOK) {
    // Checks to if the status of sensor one has changed
    if (!Firebase.RTDB.readStream(&fbdo_one)) {
      Serial.printf("stream 1 read error, %s\n\n", fbdo_one.errorReason().c_str());
    }
    // Checking to see that the stream returned from Firebase is available
    if (fbdo_one.streamAvailable()) {
      onStatusOne = fbdo_one.stringData(); // Sets the status of sensor one locally
    }

    // Checks to see if the status of sensor two has changed
    if (!Firebase.RTDB.readStream(&fbdo_two)) {
      Serial.printf("stream 2 read error, %s\n\n", fbdo_two.errorReason().c_str());
    }
    // Checking to see that the stream returned from Firebase is available
    if (fbdo_two.streamAvailable()) {
      onStatusTwo = fbdo_two.stringData(); // Sets the status of sensor two locally
    }
  }

  // Displaying the temperture of sensor one on the OLED display
  // Checks to see if the status of sensor one is active or off 
  // or if the sensor is disconnected
  if ((onStatusOne == "Active") || (tempCSensorOne == -999.0)) {
    Serial.print(onStatusOne);
    Serial.println("<------------On---------->");
    clearSensorDisplayOff(20);
    sensorOneDisplay(tempCSensorOne);
  }
  else if (onStatusOne == "Off") {
    Serial.print(onStatusOne);
    Serial.println("<-----------Off---------->");
    clearSensorOneTempC();
    sensorDisplayOff(20);
  }

  // Displaying the temperture of sensor two on the OLED display
  // Checks to see if the status of sensor two is active or off 
  // or if the sensor is disconnected
  if ((onStatusTwo == "Active") || tempCSensorTwo == -999.0) {
    Serial.print(onStatusTwo);
    Serial.println("<-----------On----------->");
    clearSensorDisplayOff(42);
    sensorTwoDisplay(tempCSensorTwo);
  }
  else if (onStatusTwo == "Off") {
    Serial.print(onStatusTwo);
    Serial.println("<-----------Off----------->");
    clearSensorTwoTempC();
    sensorDisplayOff(42);
  }

}

///////////////////////////////////////////////////////////////////////////////////////
// Method : sendToFirebase(String path, float value)
// Inputs : String path - Location path in Firebase which is written to
//          float value - Data to send to Firebase
// Outputs: None
// Sending float data to Firebase at a specific path
// Used to send temperature data and key value for disconnection
///////////////////////////////////////////////////////////////////////////////////////
void sendToFirebase(String path, float value) {
  if (Firebase.RTDB.setFloat(&fbdo, path, value)) {
      Serial.println(); 
      Serial.print(value);
      Serial.print("- successfully saved to: " + fbdo.dataPath());
  }
  else {
    Serial.println("FAILED: " + fbdo.errorReason());
  }
}

///////////////////////////////////////////////////////////////////////////////////////
// Method : sendToFirebaseString(String path, String value)
// Inputs : String path - Location path in Firebase which is written to
//          String value - Data to send to Firebase
// Outputs: None
// Sending string data to Firebase at a specific path
// Used to set the status of a sensor in Firebase
///////////////////////////////////////////////////////////////////////////////////////
void sendToFirebaseString(String path, String value) {
  if (Firebase.RTDB.setString(&fbdo, path, value)) {
      Serial.println(); 
      Serial.print(value);
      Serial.print("- successfully saved to: " + fbdo.dataPath());
  }
  else {
    Serial.println("FAILED: " + fbdo.errorReason());
  }
}

///////////////////////////////////////////////////////////////////////////////////////
// Method : readFromFirebaseString(String path)
// Inputs : String path - Location path in Firebase which is read from
// Outputs : bool value representing if the status of the sensor is active(on)/off
//           true - the status of the sensor is active(on)
//           false - the status of the sensor is off
// Reading string data from Firebase at a specific path
// Used to read the status of a sensor in Firebase
///////////////////////////////////////////////////////////////////////////////////////
bool readFromFirebaseString(String path) {
  if (Firebase.RTDB.getString(&fbdo, path)) {
    if ((fbdo.stringData() == "Active") && (path == "Sensors/Sensor_One")) {
      return true;
    }
    else if ((fbdo.stringData() == "Disconnected") && (path == "Sensors/Sensor_One")){
      return false;
    }
    else if ((fbdo.stringData() == "Active") && (path == "Sensors/Sensor_Two")) {
      return true;
    }
    else if ((fbdo.stringData() == "Disconnected") && (path == "Sensors/Sensor_Two")){
      return false;
    }
  }
  else {
    Serial.println("FAILED: " + fbdo.errorReason());
  }
}

///////////////////////////////////////////////////////////////////////////////////////
// Method : readingDisplaySetup()
// Inputs : None
// Outputs : None
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

///////////////////////////////////////////////////////////////////////////////////////
// Method : sensorOneDisplay(float temp)
// Inputs : float temp - 1) the current temperature of sensor one 
//                       2) key value for disconnected sensor (-999.0)
// Outputs : None
// 1) Displays the temperature readings for sensor one
// 2) Displays "UNPLUG" if sensor one disconnects
///////////////////////////////////////////////////////////////////////////////////////
void sensorOneDisplay(float temp) {
  clearSensorOneTempC(); // Clears the previous sensor one temperature
  display.setTextSize(2);     
  display.setTextColor(SSD1306_WHITE); 
  display.setCursor(34, 20);
  // Checking if sensor one is connected
  if (temp != -999.00) {
    display.print(temp); // Writes the temperature to the screen
  }
  else {
    display.print("UNPLUG"); // Writes "UNPLUG" to the screen
  }
  display.display(); // Display new changes to the screen
  prevTempOneC = temp; // Setting the previous temperature to the current temperature
}

///////////////////////////////////////////////////////////////////////////////////////
// Method : sensorTwoDisplay(float temp)
// Inputs : float temp - 1) the current temperature of sensor two 
//                       2) key value for disconnected sensor (-999.0)
// Outputs : None
// 1) Displays the temperature readings for sensor one
// 2) Displays "UNPLUG" if sensor one disconnects
///////////////////////////////////////////////////////////////////////////////////////
void sensorTwoDisplay(float temp) {
  clearSensorTwoTempC(); // Clears the previous sensor two temperature
  display.setTextSize(2);     
  display.setTextColor(SSD1306_WHITE); 
  display.setCursor(34, 42);
  // Checking if sensor  two is connected
  if (temp != -999.00) {
    display.print(temp); // Writes the temperature to the screen
  }
  else {
    display.print("UNPLUG"); // Writes "UNPLUG" to the screen
  }
  display.display(); // Display new changes to the screen
  prevTempTwoC = temp; // Setting the previous temperature to the current temperature
}

///////////////////////////////////////////////////////////////////////////////////////
// Method : clearSensorOneTempC()
// Inputs : None
// Outputs : None
// Writes over currently existing temperature reading or message in text color black
// Clears the previous temperature reading for sensor one from the OLED display 
// Clears "UNPLUG" in the case of disconnection
///////////////////////////////////////////////////////////////////////////////////////
void clearSensorOneTempC() {
  display.setCursor(34,20);
  display.setTextColor(SSD1306_BLACK); // Color BLACK used to write over existing message
  // Checking if a temperature needs to be cleared from the screen
  if (prevTempOneC != -999.00) {
    display.print(prevTempOneC); // Writing over the currently displayed temperature
  }
  else {
    display.print("UNPLUG"); // Writing over the message "UNPLUG"
  }
}

///////////////////////////////////////////////////////////////////////////////////////
// Method : clearSensorTwoTempC()
// Inputs : None
// Outputs : None
// Writes over currently existing temperature reading or message in text color black
// Clears the previous temperature reading for sensor two from the OLED display 
// Clears "UNPLUG" in the case of disconnection
///////////////////////////////////////////////////////////////////////////////////////
void clearSensorTwoTempC() {
  display.setCursor(34,42);
  display.setTextColor(SSD1306_BLACK); // Color BLACK used to write over existing message
  // Checking if a temperature needs to be cleared from the screen
  if (prevTempTwoC != -999.00) {
    display.print(prevTempTwoC); // Writing over the currently displayed temperature
  }
  else {
    display.print("UNPLUG"); // Writing over the message "UNPLUG"
  }
}

///////////////////////////////////////////////////////////////////////////////////////
// Method : sensorDisplayOff(int pos_y)
// Inputs : int pos_y - pixels down on the screen to display
// Outputs : None
// Displays "Off" to the OLED display based on position y in pixels on the screen
// Used for 
///////////////////////////////////////////////////////////////////////////////////////
void sensorDisplayOff(int pos_y) {
  display.setTextSize(2);     
  display.setTextColor(SSD1306_WHITE); 
  display.setCursor(34, pos_y);
  display.print("Off"); // Writing "Off" to the display
  display.display(); // Display new changes to the screen
}

///////////////////////////////////////////////////////////////////////////////////////
// Method : clearSensorDisplayOff(int pos_y)
// Inputs : int pos_y - pixels down on the screen to clear
// Outputs : None
// Clears "Off" from the OLED display based on position y on the screen
///////////////////////////////////////////////////////////////////////////////////////
void clearSensorDisplayOff(int pos_y) {
  display.setCursor(34, pos_y);
  display.setTextColor(SSD1306_BLACK);
  display.print("Off"); // Writing "Off" to the display
}
