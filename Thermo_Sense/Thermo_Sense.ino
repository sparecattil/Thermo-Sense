#include <Arduino.h>
#include <Hashtable.h> 
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
#include <ESP_Mail_Client.h>

#define WIFI_SSID "UI-DeviceNet"
#define WIFI_PASSWORD "UI-DeviceNet"
#define API_KEY "AIzaSyA6e2_8HoCuZyHfXt_HToq3FBO1MH2jUBE"
#define DATABASE_URL "https://thermostat-ed3d4-default-rtdb.firebaseio.com/"
#define SCREEN_WIDTH 128 
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
#define SMTP_HOST "smtp.gmail.com"
#define SMTP_PORT 465
#define AUTHOR_EMAIL "seniordesignsebshivjohnlogan@gmail.com"
#define AUTHOR_PASSWORD "ymgw lmeh tcho qqhy"
#define RECIPIENT_EMAIL "spddimensions@gmail.com"

SMTPSession smtp;
ESP_Mail_Session configMail;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void smtpCallback(SMTP_Status status); // Callback function to get the Email sending status

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
bool test = true;

const int oneWireBus = 4; // GPIO pin for the DS18B20 sensor 

OneWire oneWire(oneWireBus); // Setting up a oneWire instance to communicate with any OneWire devices
DallasTemperature sensors(&oneWire); // Passing oneWire reference to Dallas Temperature sensor 
int numberOfDevices; // Number of temperature devices found
DeviceAddress tempDeviceAddress; // Current device address

//float minTempLimitSensorOne; // Minimum temperature limit of sensor one
//float maxTempLimitSensorOne; // Maximum temperature limit of sensor one
//float minTempLimitSensorTwo; // Minimum temperature limit of sensor two
//float maxTempLimitSensorTwo; // Maximum temperature limit of sensor two
/*
Hashtable<String, float> tempThresholds;
tempThresholds.put("Threshold/Sensor_One/Min/Celsius", 50.0);
tempThresholds.put("Threshold/Sensor_One/Min/Fahrenheit", 122.0);
tempThresholds.put("Threshold/Sensor_One/Max/Celsius", 50.0);
tempThresholds.put("Threshold/Sensor_One/Max/Fahrenheit", 122.0);
tempThresholds.put("Threshold/Sensor_Two/Min/Celsius", 50.0);
tempThresholds.put("Threshold/Sensor_Two/Min/Fahrenheit", 122.0);
tempThresholds.put("Threshold/Sensor_Two/Max/Celsius", 50.0);
tempThresholds.put("Threshold/Sensor_Two/Max/Fahrenheit", 122.0);
*/

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

  mailSetup();

}

void loop() {
  sensors.requestTemperatures(); 
  //float temperatureC = sensors.getTempCByIndex(0);
  //float temperatureF = sensors.getTempFByIndex(0);
  float tempCSensorOne;
  float tempFSensorOne;
  float tempCSensorTwo;
  float tempFSensorTwo;

  // Loop through each device, print out temperature data
  for (int i=0;i<numberOfDevices; i++) {
    // Search the wire for address
    if (sensors.getAddress(tempDeviceAddress, i)) {
      sensors.setResolution(tempDeviceAddress, 12);
      // Output the device ID
      Serial.print("Temperature for device: ");
      Serial.println(i,DEC);

      float tempC = round(sensors.getTempC(tempDeviceAddress) * 100.0) / 100.0;
      float tempF = round(DallasTemperature::toFahrenheit(tempC) * 100.0) / 100.0;
      // Print the data
      if (i == 0) {
        sensorOneStatus = true;
        tempCSensorOne = tempC;
        tempFSensorOne = tempF;
      }
      else if (i == 1) {
        sensorTwoStatus = true;
        tempCSensorTwo = tempC;
        tempFSensorTwo = tempF;
      }
      Serial.print("Temp C: ");
      Serial.print(tempC);
      Serial.print(" Temp F: ");
      Serial.println(tempF);
    }
    else {
      if (i == 0) {
        sensorOneStatus = false;
      }
      else if (i == 1) {
        sensorTwoStatus = false;
      }
    }
  }

  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0)) {
    //&& (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0)
    sendDataPrevMillis = millis();
    if (prevTempOneC != tempCSensorOne) {
      sendToFirebase("Temp/Sensor_One/Celsius", tempCSensorOne);
      sendToFirebase("Temp/Sensor_One/Fahrenheit", tempFSensorOne);
    }
    if (prevTempTwoC != tempCSensorTwo) {
      sendToFirebase("Temp/Sensor_Two/Celsius", tempCSensorTwo);
      sendToFirebase("Temp/Sensor_Two/Fahrenheit", tempFSensorTwo);
    }
    //sendToFirebase("Power_Status", powerStatus);
  }
  //delay(1000);
  sensorOneDisplay(tempCSensorOne);
  sensorTwoDisplay(tempCSensorTwo);


  readFromFirebaseFloat("Threshold/Sensor_One/Max/Celsius", tempCSensorOne, tempCSensorTwo);
  /*
  if(test == true) {
    test = false;
    sendEmailAsync();
  }
  */
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
    if (path == "Threshold/Sensor_One/Min/Celsius") {
      lessThanThreshold(currentOneC, fbdo.floatData(), &emailLockMinOne);
    }
    else if (path == "Threshold/Sensor_One/Max/Celsius") {
      greaterThanThreshold(currentOneC, fbdo.floatData(), &emailLockMaxOne);
    }
    else if (path == "Threshold/Sensor_Two/Min/Celsius") {
      lessThanThreshold(currentTwoC, fbdo.floatData(), &emailLockMinTwo);
    }
    else if (path == "Threshold/Sensor_Two/Max/Celsius") {
      greaterThanThreshold(currentTwoC, fbdo.floatData(), &emailLockMaxTwo);
    }
      // if (fbdo.dataType() == "float") {
      //   if (path == "Threshold/Sensor_One/Min/Celsius")) {
      //     lessThanThreshold(currentOneC, fbdo.floatData(), &emailLockMinOne);
      //   }
      //   else if (path == "Threshold/Sensor_One/Max/Celsius") {
      //     greaterThanThreshold(currentOneC, fbdo.floatData(), &emailLockMaxOne);
      //   }
      //   else if (path == "Threshold/Sensor_Two/Min/Celsius") {
      //     lessThanThreshold(currentTwoC, fbdo.floatData(), &emailLockMinTwo);
      //   }
      //   else if (path == "Threshold/Sensor_Two/Max/Celsius") {
      //     greaterThanThreshold(currentTwoC, fbdo.floatData(), &emailLockMaxTwo);
      //   }
      // }
      // else {
      //   Serial.println("Not correct data type on read float");
      // }
  }
  else {
    Serial.println("FAILED: " + fbdo.errorReason());
  }
}

void lessThanThreshold(float currentC, float threshold, bool *emailLock) {
  if ((currentC < threshold) && (!*emailLock)) {
    *emailLock = true;
    sendEmailAsync();
  }
  else if (currentC >= threshold) {
    *emailLock = false;
  }
}

void greaterThanThreshold(float currentC, float threshold, bool *emailLock) {
  if ((currentC > threshold) && (!*emailLock)) {
    *emailLock = true;
    sendEmailAsync();
  }
  else if ((currentC <= threshold) && (*emailLock)) {
    Serial.println("RESET MAX");
    *emailLock = false;
  }
}

void emailTask(void *param) {
  sendEmail(); // Call your email function here
  vTaskDelete(NULL); // Delete the task after email is sent
}

void sendEmailAsync() {
  if (emailTaskHandle == NULL) { // Check if task is already running
    xTaskCreatePinnedToCore(
      emailTask,      // Task function
      "Email Task",   // Task name
      8192,           // Stack size
      NULL,           // Parameters
      1,              // Task priority
      &emailTaskHandle, // Task handle
      1               // Run on core 1
    );
  }
}


/* To be Deleted
// function to print a device address
void printAddress(DeviceAddress deviceAddress) {
  for (uint8_t i = 0; i < 8; i++){
    if (deviceAddress[i] < 16) Serial.print("0");
      Serial.print(deviceAddress[i], HEX);
  }
}
// To be Deleted
*/

void mailSetup() {
  /*  Set the network reconnection option */
  MailClient.networkReconnect(true);

  /** Enable the debug via Serial port
   * 0 for no debugging
   * 1 for basic level debugging
   *
   * Debug port can be changed via ESP_MAIL_DEFAULT_DEBUG_PORT in ESP_Mail_FS.h
   */
  smtp.debug(1);

  /* Set the callback function to get the sending results */
  smtp.callback(smtpCallback);



  /* Set the session config */
  configMail.server.host_name = SMTP_HOST;
  configMail.server.port = SMTP_PORT;
  configMail.login.email = AUTHOR_EMAIL;
  configMail.login.password = AUTHOR_PASSWORD;
  configMail.login.user_domain = "";

  /*
  Set the NTP config time
  For times east of the Prime Meridian use 0-12
  For times west of the Prime Meridian add 12 to the offset.
  Ex. American/Denver GMT would be -6. 6 + 12 = 18
  See https://en.wikipedia.org/wiki/Time_zone for a list of the GMT/UTC timezone offsets
  */
  configMail.time.ntp_server = F("pool.ntp.org,time.nist.gov");
  configMail.time.gmt_offset = 3;
  configMail.time.day_light_offset = 0;
}

void sendEmail(){
  Serial.println("Got to sendEmail()");
  /* Declare the message class */
  SMTP_Message message;

  /* Set the message headers */
  message.sender.name = F("ESP");
  message.sender.email = AUTHOR_EMAIL;
  message.subject = F("ESP Test Email");
  message.addRecipient(F("Sara"), RECIPIENT_EMAIL);
   
  //Send raw text message
  String textMsg = "Hello World! - Sent from ESP board";
  message.text.content = textMsg.c_str();
  message.text.charSet = "us-ascii";
  message.text.transfer_encoding = Content_Transfer_Encoding::enc_7bit;
  
  message.priority = esp_mail_smtp_priority::esp_mail_smtp_priority_low;
  message.response.notify = esp_mail_smtp_notify_success | esp_mail_smtp_notify_failure | esp_mail_smtp_notify_delay;


  /* Connect to the server */
  if (!smtp.connect(&configMail)){
   // ESP_MAIL_PRINTF("Connection error, Status Code: %d, Error Code: %d, Reason: %s", smtp.statusCode(), smtp.errorCode(), smtp.errorReason().c_str());
    return;
  }
  
  
  if (!MailClient.sendMail(&smtp, &message)) {
    Serial.println("Error sending Email, " + smtp.errorReason());
  }
 
}


// Callback function to get the Email sending status
void smtpCallback(SMTP_Status status){
  Serial.println(status.info()); // Printing current status

  // Print the sending result
  if (status.success()) {
    Serial.println("----------------");
    ESP_MAIL_PRINTF("Message sent success: %d\n", status.completedCount());
    ESP_MAIL_PRINTF("Message sent failed: %d\n", status.failedCount());
    Serial.println("----------------\n");

    for (size_t i = 0; i < smtp.sendingResult.size(); i++) {
      SMTP_Result result = smtp.sendingResult.getItem(i); // Getting the result item
      ESP_MAIL_PRINTF("Message No: %d\n", i + 1);
      ESP_MAIL_PRINTF("Status: %s\n", result.completed ? "success" : "failed");
      ESP_MAIL_PRINTF("Recipient: %s\n", result.recipients.c_str());
      ESP_MAIL_PRINTF("Subject: %s\n", result.subject.c_str());
    }
    Serial.println("----------------\n");

    smtp.sendingResult.clear(); // Clearing the sending result
  }
}

// Sets up the two DS18B20 temperature sensors
void tempSensorSetup() {
  sensors.begin(); // Initializing communication with the sensor on the OneWire bus

  numberOfDevices = sensors.getDeviceCount(); // Grabbing a count of devices on the wire
  
  Serial.print(numberOfDevices, DEC);
  Serial.println(" devices have been found");
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
  display.print(temp);
  display.display();
  prevTempOneC = temp;
}

void sensorTwoDisplay(float temp) {
  clearSensorTwoTempC();
  display.setTextSize(2);     
  display.setTextColor(SSD1306_WHITE); 
  display.setCursor(34, 42);     
  display.print(temp);
  display.display();
  prevTempTwoC = temp;
}

void clearSensorOneTempC() {
  display.setCursor(34,20);
  display.setTextColor(SSD1306_BLACK);
  display.print(prevTempOneC);
}

void clearSensorTwoTempC() {
  display.setCursor(34,42);
  display.setTextColor(SSD1306_BLACK);
  display.print(prevTempTwoC);
}
