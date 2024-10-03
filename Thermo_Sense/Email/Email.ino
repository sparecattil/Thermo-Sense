#include <Arduino.h> 
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
//#include <Wire.h>
#include <ESP_Mail_Client.h>


#define WIFI_SSID "UI-DeviceNet"
#define WIFI_PASSWORD "UI-DeviceNet"
#define API_KEY "AIzaSyA6e2_8HoCuZyHfXt_HToq3FBO1MH2jUBE"
#define DATABASE_URL "https://thermostat-ed3d4-default-rtdb.firebaseio.com/"
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
TaskHandle_t emailTaskHandle = NULL; // Handle for the email task

bool signupOK = false;

void setup() {
  Serial.begin(115200);

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

  mailSetup();

}

void loop() {
  // put your main code here, to run repeatedly:
  readFromFirebaseFloat("Threshold/Sensor_One/Max/Celsius", tempCSensorOne, tempCSensorTwo);
  Serial.println("Hello");
  delay(3000);

}


void readFromFirebaseFloat(String path, float currentOneC, float currentTwoC) {
  if (Firebase.RTDB.getFloat(&fbdo, path)) {
    
  }
  else {
    Serial.println("FAILED: " + fbdo.errorReason());
  }
}

void emailTask(void *param) {
  sendEmail(); // Call your email function here
  vTaskSuspend(emailTaskHandle); // Delete the task after email is sent
  emailTaskHandle = NULL;
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
