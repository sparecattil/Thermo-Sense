// Import Statements for Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, get, child, onValue, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Configure Firbase with Keys
const firebaseConfig = {
  apiKey: "AIzaSyA6e2_8HoCuZyHfXt_HToq3FBO1MH2jUBE",
  authDomain: "thermostat-ed3d4.firebaseapp.com",
  databaseURL: "https://thermostat-ed3d4-default-rtdb.firebaseio.com",
  projectId: "thermostat-ed3d4",
  storageBucket: "thermostat-ed3d4.appspot.com",
  messagingSenderId: "1069567062254",
  appId: "1:1069567062254:web:15b462b86a14a6c389c3ff"
};

// Initilaization of Firebase App
const app = initializeApp(firebaseConfig);

// Set variable for database --> call this along with location to refernece a certain location within the database. Ex: (databas, 'Email')
const database = getDatabase(app);

// Data Reference for Firebase
const data = ref(database);

// Local variables to hold celsius value from each sensor
let celsiusOne;
let celsiusTwo;

// Local variables to hold fahrenheit value from each sensor
let fahrenheitOne
let fahrenheitTwo

// Sensor One Temperature Varaiable and Mode Definer
const tempSensorOne = document.getElementById("tempSensorOne"); // Text
const modeSensorOne = document.getElementById("modeSensorOne"); // Button
var sensorOneMode = "°C";

// Sensor Two Temperature Varaiable and Mode Definer
const tempSensorTwo = document.getElementById("tempSensorTwo"); // Text
const modeSensorTwo = document.getElementById("modeSensorTwo"); // Button
var sensorTwoMode = "°C";

// Email Input Button --> Checkout updateEmail.addEventListener
const updateEmail = document.getElementById("updateEmail");

// Input box for user defined threshold messages --> checkout corresponding EventListeners for more information
const oneMinMessageText = document.getElementById("sendOneMinMessage");
const oneMaxMessageText= document.getElementById("sendOneMaxMessage");
const twoMinMessageText = document.getElementById("sendTwoMinMessage");
const twoMaxMessageText= document.getElementById("sendTwoMaxMessage");

// Stores Recievers Email
let email = 'spatel9603@gmail.com';

// Stores Messages for each threshold
let oneMinMessage = "OneMin";
let oneMaxMessage = "OneMax";
let twoMinMessage = "TwoMin";
let twoMaxMessage = "TwoMax";

// Stores message that needs to be sent in the email based on what threshold was met
let message;


/* Chart Data, array's that store a hashmap of data. Each hashmap has {value, timestamp}.
   These arrays will be used to store the last 300s of data from each sensor. */
let senseOne_Celsius = []; 
let senseOne_Fahrenheit = []; 
let senseTwo_Celsius = []; 
let senseTwo_Fahrenheit = []; 

/* Chart Data, array's that store a hashmap of data. Each hashmap has {x, y}.
   These arrays will be used to store the last 300s of data from each sensor.
   If timestamp for a certain value is longer than 300s ago, that value will be removed
   from the chart. */
let celsiusOneData = [];
let celsiusTwoData = [];
let fahrenheitOneData = [];
let fahrenheitTwoData = [];

// Button ID's for Sensor One Threshold
let oneMinDown = document.getElementById("sensorOneMinDown"); // Min Down
let oneMinUp = document.getElementById("sensorOneMinUp"); // Min Up
let oneMaxDown = document.getElementById("sensorOneMaxDown");// Max Down
let oneMaxUp = document.getElementById("sensorOneMaxUp"); // Max Up

// Text Output for Min and Max Threshold - Sensor One 
let oneMinValue = document.getElementById("sensorOneMin"); // Min Value
let oneMaxValue = document.getElementById("sensorOneMax"); // Max Value
let currentOneMin = parseFloat(parseFloat(oneMinValue.textContent).toFixed(2)); // Local Copy of oneMinValue
let currentOneMax = parseFloat(parseFloat(oneMaxValue.textContent).toFixed(2)); // Local Copy of oneMaxValue

// Interval for Sensor One Threshold Up and Down Buttons handles -> Allows Hold
let oneIncrementInterval;

// Timeout to deal with .01 incrementation for Sensor One Threshold -> Allows Single Press
let oneSinglePressTimeout;

// Button ID's for Sensor Two Threshold
let twoMinDown = document.getElementById("sensorTwoMinDown"); // Min Down 
let twoMinUp = document.getElementById("sensorTwoMinUp"); // Min Up
let twoMaxDown = document.getElementById("sensorTwoMaxDown"); // Max Down
let twoMaxUp = document.getElementById("sensorTwoMaxUp"); // Max up

// Text Output for Min and Max Threshold - Sensor Two 
let twoMinValue = document.getElementById("sensorTwoMin"); // Min Value 
let twoMaxValue = document.getElementById("sensorTwoMax"); // Max Value
let currentTwoMin = parseFloat(parseFloat(twoMinValue.textContent).toFixed(2)); // Local Copy of twoMinValue
let currentTwoMax = parseFloat(parseFloat(twoMaxValue.textContent).toFixed(2)); // Local Copy of twoMaxValue

// Interval for Sensor Two Threshold Up and Down Buttons handles -> Allows Hold
let incrementInterval;

// Timeout to deal with .01 incrementation for Sensor Two Threshold -> Allows Single Press
let singlePressTimeout;

// Email Boolean --> If Sensor Email Notification is false then send else wait to be rest --> True
let emailNotificationSentOne = false;
let emailNotificationSentTwo = false;

// Sensor Disconnect Boolean --> If false then not disconnected else if true then sensor disconnected.
let disconnectedOne = false;
let disconnectedTwo = false;

// Sensor Power Boolean --> If false then not disconnected else if true then sensor disconnected.
let powerOne = true;
let powerTwo = true;

// Text Input from Email Section
let emailInput = document.getElementById("email");

// Text Input from Min/Max Section for both Sensors
let oneMinText = document.getElementById("sensorOneMinMessage");
let oneMaxText = document.getElementById("sensorOneMaxMessage");
let twoMinText = document.getElementById("sensorTwoMinMessage");
let twoMaxText = document.getElementById("sensorTwoMaxMessage");

// Variables to tell what mode teh Chart is on
let chartCelsius = true;
let chartFahrenheit = false;

// Button ID's for disconnect and connect
const disconnectOne = document.getElementById("DisconnectOne");
const disconnectTwo = document.getElementById("DisconnectTwo");

let powerMain = true;
let powerTime = Date.now();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////SPACE BLOCK///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////// Set Default Firebase Values Start ////////////////////////

// Sensor One Thrshold Values
set(ref(database, 'Threshold/Sensor_One/Min/Celsius'), parseFloat(20));
set(ref(database, 'Threshold/Sensor_One/Min/Fahrenheit'), parseFloat(68));
set(ref(database, 'Threshold/Sensor_One/Max/Celsius'), parseFloat(50));
set(ref(database, 'Threshold/Sensor_One/Max/Fahrenheit'), parseFloat(122));

// Sensor Two Thrshold Values
set(ref(database, 'Threshold/Sensor_Two/Min/Celsius'), parseFloat(20));
set(ref(database, 'Threshold/Sensor_Two/Min/Fahrenheit'), parseFloat(68));
set(ref(database, 'Threshold/Sensor_Two/Max/Celsius'), parseFloat(50));
set(ref(database, 'Threshold/Sensor_Two/Max/Fahrenheit'), parseFloat(122));

// Set Both Sensors as Active upon startup
set(ref(database, "Sensors/Sensor_One"), "Active");
set(ref(database, "Sensors/Sensor_Two"), "Active");

////////////////////// Set Default Firebase Values End //////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////SPACE BLOCK///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////// Function Definition Start ////////////////////////////

/////////////////////////////////////////////////////////////////////////////////
// Name: celsiusToFahrenheit
// Input: FLoat Value 
// Procedure: Takes in celsius value and converts the value to fahrenheit using
//            (input * (9/5)) + 32 = output
// Output: Float Value
/////////////////////////////////////////////////////////////////////////////////
function celsiusToFahrenheit(value) {
  value = (value * (9/5)) + 32;
  value = parseFloat(value).toFixed(2);
  //console.log("ONE: " + value);
  return value;
}

/////////////////////////////////////////////////////////////////////////////////
// Name: fahrenheitToCelsius
// Input: FLoat Value 
// Procedure: Takes in fahrenheit value and converts the value to celsius using
//            (input - 32) * (5/9) = output
// Output: Float Value
/////////////////////////////////////////////////////////////////////////////////
function fahrenheitToCelsius(value) {
  value = (value - 32) * (5/9);
  value = parseFloat(value).toFixed(2);
  //console.log("TWO: " + value);
  return value;
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sensorOneMinDown
// Input: None
// Procedure: The following function will check if the mode is celsius or 
//            fahrenheit, based on that it will check if the current minimum
//            threshold set is below the min minimum temperature. If yes,
//            set the value -> min minimum, else decrement value by .01.
//            Update the GUI with the currentTwoMin value, and update the
//            firebase database refrences to the thresholds, for both 
//            celsius and fahrenheit.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sensorOneMinDown() {
  if (sensorOneMode == "°C") {
    if (currentOneMin <= -10) {
      currentOneMin = -10.00;
    }
    else {
      currentOneMin = currentOneMin - 0.01;
    }
    oneMinValue.textContent = parseFloat(currentOneMin).toFixed(2) + sensorOneMode;
    currentOneMin = parseFloat(parseFloat(currentOneMin).toFixed(2));
    set(ref(database, 'Threshold/Sensor_One/Min/Celsius'), currentOneMin);
    set(ref(database, 'Threshold/Sensor_One/Min/Fahrenheit'), parseFloat(celsiusToFahrenheit(currentOneMin)));
  }
  else if (sensorOneMode == "°F") {
    if (currentOneMin <= 14) {
      currentOneMin = 14.00;
    }
    else {
      currentOneMin = currentOneMin - 0.01;
    }
    oneMinValue.textContent = parseFloat(currentOneMin).toFixed(2) + sensorOneMode;
    currentOneMin = parseFloat(parseFloat(currentOneMin).toFixed(2));
    set(ref(database, 'Threshold/Sensor_One/Min/Fahrenheit'), currentOneMin);
    set(ref(database, 'Threshold/Sensor_One/Min/Celsius'), parseFloat(fahrenheitToCelsius(currentOneMin)));
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sensorOneMinUp
// Input: None
// Procedure: The following function will check if the mode is celsius or 
//            fahrenheit, based on that it will check if the current minimum
//            threshold set is below the max minimum temperature. If yes,
//            set the value -> max minimum, else increment value by .01.
//            Update the GUI with the currentTwoMax value, and update the
//            firebase database refrences to the thresholds, for both 
//            celsius and fahrenheit.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sensorOneMinUp() {
  if (sensorOneMode == "°F") {
    if (currentOneMin >= 145.40) {
      currentOneMin = 145.40;
    }
    else {
      currentOneMin = currentOneMin + 0.01;
    }
    oneMinValue.textContent = parseFloat(currentOneMin).toFixed(2) + sensorOneMode;
    currentOneMin = parseFloat(parseFloat(currentOneMin).toFixed(2));
    set(ref(database, 'Threshold/Sensor_One/Min/Celsius'), parseFloat(fahrenheitToCelsius(currentOneMin)));
    set(ref(database, 'Threshold/Sensor_One/Min/Fahrenheit'), currentOneMin);
  }
  else if (sensorOneMode == "°C") {
    if (currentOneMin >= 63.00) {
      currentOneMin = 63.00;
    }
    else {
      currentOneMin = currentOneMin + 0.01;
    }
    oneMinValue.textContent = parseFloat(currentOneMin).toFixed(2) + sensorOneMode;
    currentOneMin = parseFloat(parseFloat(currentOneMin).toFixed(2));
    set(ref(database, 'Threshold/Sensor_One/Min/Fahrenheit'), parseFloat(celsiusToFahrenheit(currentOneMin)));
    set(ref(database, 'Threshold/Sensor_One/Min/Celsius'), currentOneMin);
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sensorOneMaxDown
// Input: None
// Procedure: The following function will check if the mode is celsius or 
//            fahrenheit, based on that it will check if the current maximum
//            threshold set is below the min maximum temperature. If yes,
//            set the value -> min maximum, else decrement value by .01.
//            Update the GUI with the currentTwoMin value, and update the
//            firebase database refrences to the thresholds, for both 
//            celsius and fahrenheit.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sensorOneMaxDown() {
  if (sensorOneMode == "°C") {
    if (currentOneMax <= -10) {
      currentOneMax = -10.00;
    }
    else {
      currentOneMax = currentOneMax - 0.01;
    }
    oneMaxValue.textContent = parseFloat(currentOneMax).toFixed(2) + sensorOneMode;
    currentOneMax = parseFloat(parseFloat(currentOneMax).toFixed(2));
    set(ref(database, 'Threshold/Sensor_One/Max/Celsius'), currentOneMax);
    set(ref(database, 'Threshold/Sensor_One/Max/Fahrenheit'), parseFloat(celsiusToFahrenheit(currentOneMax)));
  }
  else if (sensorOneMode == "°F") {
    if (currentOneMax <= 14) {
      currentOneMax = 14.00;
    }
    else {
      currentOneMax = currentOneMax - 0.01;
    }
    oneMaxValue.textContent = parseFloat(currentOneMax).toFixed(2) + sensorOneMode;
    currentOneMax = parseFloat(parseFloat(currentOneMax).toFixed(2));
    set(ref(database, 'Threshold/Sensor_One/Max/Fahrenheit'), currentOneMax);
    set(ref(database, 'Threshold/Sensor_One/Max/Celsius'), parseFloat(fahrenheitToCelsius(currentOneMax)));
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sensorOneMaxUp
// Input: None
// Procedure: The following function will check if the mode is celsius or 
//            fahrenheit, based on that it will check if the current maximum
//            threshold set is below the max maximum temperature. If yes,
//            set the value -> max maximum, else increment value by .01.
//            Update the GUI with the currentTwoMax value, and update the
//            firebase database refrences to the thresholds, for both 
//            celsius and fahrenheit.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sensorOneMaxUp() {
  if (sensorOneMode == "°F") {
    if (currentOneMax >= 145.40) {
      currentOneMax = 145.40;
    }
    else {
      currentOneMax = currentOneMax + 0.01;
    }
    oneMaxValue.textContent = parseFloat(currentOneMax).toFixed(2) + sensorOneMode;
    currentOneMax = parseFloat(parseFloat(currentOneMax).toFixed(2));
    set(ref(database, 'Threshold/Sensor_One/Max/Celsius'), parseFloat(fahrenheitToCelsius(currentOneMax)));
    set(ref(database, 'Threshold/Sensor_One/Max/Fahrenheit'), currentOneMax);
  }
  else if (sensorOneMode == "°C") {
    if (currentOneMax >= 63.00) {
      currentOneMax = 63.00;
    }
    else {
      currentOneMax = currentOneMax + 0.01;
    }
    oneMaxValue.textContent = parseFloat(currentOneMax).toFixed(2) + sensorOneMode;
    currentOneMax = parseFloat(parseFloat(currentOneMax).toFixed(2));
    set(ref(database, 'Threshold/Sensor_One/Max/Fahrenheit'), parseFloat(celsiusToFahrenheit(currentOneMax)));
    set(ref(database, 'Threshold/Sensor_One/Max/Celsius'), currentOneMax);
    
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sensorTwoMinDown
// Input: None
// Procedure: The following function will check if the mode is celsius or 
//            fahrenheit, based on that it will check if the current minimum
//            threshold set is below the min minimum temperature. If yes,
//            set the value -> min minimum, else decrement value by .01.
//            Update the GUI with the currentTwoMin value, and update the
//            firebase database refrences to the thresholds, for both 
//            celsius and fahrenheit.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sensorTwoMinDown() {
  if (sensorTwoMode == "°C") {
    if (currentTwoMin <= -10) {
      currentTwoMin = -10.00;
    }
    else {
      currentTwoMin = currentTwoMin - 0.01;
    }
    twoMinValue.textContent = parseFloat(currentTwoMin).toFixed(2) + sensorTwoMode;
    currentTwoMin = parseFloat(parseFloat(currentTwoMin).toFixed(2));
    set(ref(database, 'Threshold/Sensor_Two/Min/Celsius'), currentTwoMin);
    set(ref(database, 'Threshold/Sensor_Two/Min/Fahrenheit'), parseFloat(celsiusToFahrenheit(currentTwoMin)));
  }
  else if (sensorTwoMode == "°F") {
    if (currentTwoMin <= 14) {
      currentTwoMin = 14.00;
    }
    else {
      currentTwoMin = currentTwoMin - 0.01;
    }
    twoMinValue.textContent = parseFloat(currentTwoMin).toFixed(2) + sensorTwoMode;
    currentTwoMin = parseFloat(parseFloat(currentTwoMin).toFixed(2));
    set(ref(database, 'Threshold/Sensor_Two/Min/Fahrenheit'), currentTwoMin);
    set(ref(database, 'Threshold/Sensor_Two/Min/Celsius'), parseFloat(fahrenheitToCelsius(currentTwoMin)));
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sensorTwoMinUp
// Input: None
// Procedure: The following function will check if the mode is celsius or 
//            fahrenheit, based on that it will check if the current minimum
//            threshold set is below the max minimum temperature. If yes,
//            set the value -> max minimum, else increment value by .01.
//            Update the GUI with the currentTwoMax value, and update the
//            firebase database refrences to the thresholds, for both 
//            celsius and fahrenheit.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sensorTwoMinUp() {
  if (sensorTwoMode == "°F") {
    if (currentTwoMin >= 145.40) {
      currentTwoMin = 145.40;
    }
    else {
      currentTwoMin = currentTwoMin + 0.01;
    }
    twoMinValue.textContent = parseFloat(currentTwoMin).toFixed(2) + sensorTwoMode;
    currentTwoMin = parseFloat(parseFloat(currentTwoMin).toFixed(2));
    set(ref(database, 'Threshold/Sensor_Two/Min/Celsius'), parseFloat(fahrenheitToCelsius(currentTwoMin)));
    set(ref(database, 'Threshold/Sensor_Two/Min/Fahrenheit'), currentTwoMin);
  }
  else if (sensorTwoMode == "°C") {
    if (currentTwoMin >= 63.00) {
      currentTwoMin = 63.00;
    }
    else {
      currentTwoMin = currentTwoMin  + 0.01;
    }
    twoMinValue.textContent = parseFloat(currentTwoMin).toFixed(2) + sensorTwoMode;
    currentTwoMin = parseFloat(parseFloat(currentTwoMin).toFixed(2));
    set(ref(database, 'Threshold/Sensor_Two/Min/Fahrenheit'), parseFloat(celsiusToFahrenheit(currentTwoMin)));
    set(ref(database, 'Threshold/Sensor_Two/Min/Celsius'), currentTwoMin);
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sensorTwoMaxDown
// Input: None
// Procedure: The following function will check if the mode is celsius or 
//            fahrenheit, based on that it will check if the current maximum
//            threshold set is below the min maximum temperature. If yes,
//            set the value -> min maximum, else decrement value by .01.
//            Update the GUI with the currentTwoMin value, and update the
//            firebase database refrences to the thresholds, for both 
//            celsius and fahrenheit.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sensorTwoMaxDown() {
  //console.log("DOWN");
  if (sensorTwoMode == "°C") {
    if (currentTwoMax <= -10) {
      currentTwoMax = -10;
    }
    else {
      currentTwoMax = currentTwoMax - 0.01;
    }
    twoMaxValue.textContent = parseFloat(currentTwoMax).toFixed(2) + sensorTwoMode;
    currentTwoMax = parseFloat(parseFloat(currentTwoMax).toFixed(2));
    set(ref(database, 'Threshold/Sensor_Two/Max/Celsius'), currentTwoMax);
    set(ref(database, 'Threshold/Sensor_Two/Max/Fahrenheit'), parseFloat(celsiusToFahrenheit(currentTwoMax)));
  }
  else if (sensorTwoMode == "°F") {
    if (currentTwoMax <= 14) {
      currentTwoMax = 14;
    }
    else {
      currentTwoMax = currentTwoMax - 0.01;
    }
    twoMaxValue.textContent = parseFloat(currentTwoMax).toFixed(2) + sensorTwoMode;
    currentTwoMax = parseFloat(parseFloat(currentTwoMax).toFixed(2));
    set(ref(database, 'Threshold/Sensor_Two/Max/Fahrenheit'), currentTwoMax);
    set(ref(database, 'Threshold/Sensor_Two/Max/Celsius'),parseFloat(fahrenheitToCelsius(currentTwoMax)));
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sensorTwoMaxUp
// Input: None
// Procedure: The following function will check if the mode is celsius or 
//            fahrenheit, based on that it will check if the current maximum
//            threshold set is below the max maximum temperature. If yes,
//            set the value -> max maximum, else increment value by .01.
//            Update the GUI with the currentTwoMax value, and update the
//            firebase database refrences to the thresholds, for both 
//            celsius and fahrenheit.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sensorTwoMaxUp() {
  //console.log("UP");
  if (sensorTwoMode == "°F") {
    if (currentTwoMax >= 145.40) {
      currentTwoMax = 145.40;
    }
    else {
      currentTwoMax = currentTwoMax + 0.01;
    }
    twoMaxValue.textContent = parseFloat(currentTwoMax).toFixed(2) + sensorTwoMode;
    currentTwoMax = parseFloat(parseFloat(currentTwoMax).toFixed(2))
    set(ref(database, 'Threshold/Sensor_Two/Max/Celsius'), parseFloat(fahrenheitToCelsius(currentTwoMax)));
    set(ref(database, 'Threshold/Sensor_Two/Max/Fahrenheit'), currentTwoMax);
  }
  else if (sensorTwoMode == "°C") {
    if (currentTwoMax >= 63.00) {
      currentTwoMax = 63.00;
    }
    else {
      currentTwoMax = currentTwoMax + 0.01;
    }
    twoMaxValue.textContent = parseFloat(currentTwoMax).toFixed(2) + sensorTwoMode;
    currentTwoMax = parseFloat(parseFloat(currentTwoMax).toFixed(2))
    set(ref(database, 'Threshold/Sensor_Two/Max/Fahrenheit'), parseFloat(celsiusToFahrenheit(currentTwoMax)));
    set(ref(database, 'Threshold/Sensor_Two/Max/Celsius'), currentTwoMax);
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateOneThresholdForMode
// Input: None
// Procedure: The following function will check if the sensorMode for Sensor
//            One is set to celsius or fahrenheit. Based on that it will
//            get the values from the database and set the GUI text value to 
//            the correct output to match the users selection of mode. Then it
//            will set the local variable to that value so if the user interacts
//            with the threshold buttons it will hold the correct value.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateOneThresholdForMode(){
  if (sensorOneMode == "°C") {
    get(child(data, 'Threshold/Sensor_One/Min/Celsius')).then((snapshot) => {
      if (snapshot.exists()) {
        if (powerMain == true){
          oneMinValue.innerText = parseFloat(snapshot.val()).toFixed(2) + sensorOneMode;
        }
        currentOneMin = parseFloat(snapshot.val()).toFixed(2);
      }
    });
    get(child(data, 'Threshold/Sensor_One/Max/Celsius')).then((snapshot) => {
      if (snapshot.exists()) {
        if (powerMain == true){
          oneMaxValue.innerText = parseFloat(snapshot.val()).toFixed(2) + sensorOneMode;
        }
        currentOneMax = parseFloat(snapshot.val()).toFixed(2);
      }
    });
  }
  else if (sensorOneMode == "°F") {
    get(child(data, 'Threshold/Sensor_One/Min/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists()) {
        if (powerMain == true){
          oneMinValue.innerText = parseFloat(snapshot.val()).toFixed(2) + sensorOneMode;
        }
        currentOneMin = parseFloat(snapshot.val()).toFixed(2);
      }
    });
    get(child(data, 'Threshold/Sensor_One/Max/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists()) {
        if (powerMain == true){
          oneMaxValue.innerText = parseFloat(snapshot.val()).toFixed(2) + sensorOneMode;
        }
        currentOneMax = parseFloat(snapshot.val()).toFixed(2);
      }
    });
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateTwoThresholdForMode
// Input: None
// Procedure: The following function will check if the sensorMode for Sensor
//            Two is set to celsius or fahrenheit. Based on that it will
//            get the values from the database and set the GUI text value to 
//            the correct output to match the users selection of mode. Then it
//            will set the local variable to that value so if the user interacts
//            with the threshold buttons it will hold the correct value.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateTwoThresholdForMode(){
  if (sensorTwoMode == "°C") {
    get(child(data, 'Threshold/Sensor_Two/Min/Celsius')).then((snapshot) => {
      if (snapshot.exists()) {
        if (powerMain == true){
          twoMinValue.innerText = parseFloat(snapshot.val()).toFixed(2) + sensorTwoMode;
        }
        currentTwoMin = parseFloat(snapshot.val()).toFixed(2);
      }
    });
    get(child(data, 'Threshold/Sensor_Two/Max/Celsius')).then((snapshot) => {
      if (snapshot.exists()) {
        if (powerMain == true){
          twoMaxValue.innerText = parseFloat(snapshot.val()).toFixed(2) + sensorTwoMode;
        }
        currentTwoMax = parseFloat(snapshot.val()).toFixed(2);
      }
    });
  }
  else if (sensorTwoMode == "°F") {
    get(child(data, 'Threshold/Sensor_Two/Min/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists()) {
        if (powerMain == true){
          twoMinValue.innerText = parseFloat(snapshot.val()).toFixed(2) + sensorTwoMode;
        }
        currentTwoMin = parseFloat(snapshot.val()).toFixed(2);
      }
    });
    get(child(data, 'Threshold/Sensor_Two/Max/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists()) {
        if (powerMain == true){
          twoMaxValue.innerText = parseFloat(snapshot.val()).toFixed(2) + sensorTwoMode;
        }
        currentTwoMax = parseFloat(snapshot.val()).toFixed(2);
      }
    });
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: checkBoundaries
// Input: None
// Procedure: The following function is set on a interval. It will execute every 
//            1ms. It constantly checks and ensures that Threshold vlaues on the
//            GUI do not exceed Minimum and Maximum Values for both sensors. It 
//            also ensures that if a Sensor is disconnected then the GUI is 
//            updated to show the message for the corresponding sensor. And then 
//            constantly calls function that will update the given line on the
//            chart to show that no data is being picked up. The function also 
//            checks if a email needs to be sent based on threshold values. If 
//            email is sent the function will the reset the 
//            emailNotificationSentOne/Two by checking when the temperature 
//            returns to good status (not exceeding any threshold value --> 
//            unique for each sensor).
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function checkBoundaries() {
  
  // Check if Threshold max has met Maximum Temp when in Fahrenheit Mode --> Sensor One
  get(child(data, 'Threshold/Sensor_One/Max/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() >= 145.40 ) {
        set(ref(database, 'Threshold/Sensor_One/Max/Fahrenheit'), 145.40);
      }
  });
  
  // Check if Threshold min has met Maximum Temp when in Fahrenheit Mode --> Sensor One
  get(child(data, 'Threshold/Sensor_One/Min/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() >= 145.40 ) {
        set(ref(database, 'Threshold/Sensor_One/Min/Fahrenheit'), 145.40);
      }
  });
  
  // Check if Threshold max has met Maximum Temp when in Celsius Mode --> Sensor One
  get(child(data, 'Threshold/Sensor_One/Max/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() >= 63 ) {
        set(ref(database, 'Threshold/Sensor_One/Max/Celsius'), 63.00);
      }
  });
  
  // Check if Threshold min has met Maximum Temp when in Celsius Mode --> Sensor One
  get(child(data, 'Threshold/Sensor_One/Min/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() >= 63 ) {
        set(ref(database, 'Threshold/Sensor_One/Min/Celsius'), 63.00);
      }
  });
  
  // Check if Threshold max has met Minimum Temp when in Fahrenheit Mode --> Sensor One
  get(child(data, 'Threshold/Sensor_One/Max/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() <= 14 ) {
        set(ref(database, 'Threshold/Sensor_One/Max/Fahrenheit'), 14.00);
      }
  });
  
  // Check if Threshold min has met Minimum Temp when in Fahrenheit Mode --> Sensor One
  get(child(data, 'Threshold/Sensor_One/Min/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() <= 14 ) {
        set(ref(database, 'Threshold/Sensor_One/Min/Fahrenheit'), 14.00);
      }
  });
  
  // Check if Threshold max has met Minimum Temp when in Celsius Mode --> Sensor One
  get(child(data, 'Threshold/Sensor_One/Max/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() <= -10 ) {
        set(ref(database, 'Threshold/Sensor_One/Max/Celsius'), -10.00);
      }
  });
  
  // Check if Threshold min has met Minimum Temp when in Celsius Mode --> Sensor One
  get(child(data, 'Threshold/Sensor_One/Min/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() <= -10 ) {
        set(ref(database, 'Threshold/Sensor_One/Min/Celsius'), -10.00);
      }
  });
  
  // Check if Threshold max has met Maximum Temp when in Fahrenheit Mode --> Sensor Two
  get(child(data, 'Threshold/Sensor_Two/Max/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() >= 145.40 ) {
        set(ref(database, 'Threshold/Sensor_Two/Max/Fahrenheit'), 145.40);
      }
  });
  
  // Check if Threshold min has met Maximum Temp when in Fahrenheit Mode --> Sensor Two
  get(child(data, 'Threshold/Sensor_Two/Min/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() >= 145.40 ) {
        set(ref(database, 'Threshold/Sensor_Two/Min/Fahrenheit'), 145.40);
      }
  });
  
  // Check if Threshold max has met Maximum Temp when in Celsius Mode --> Sensor Two
  get(child(data, 'Threshold/Sensor_Two/Max/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() >= 63 ) {
        set(ref(database, 'Threshold/Sensor_Two/Max/Celsius'), 63.00);
      }
  });
  
  // Check if Threshold min has met Maximum Temp when in Celsius Mode --> Sensor Two
  get(child(data, 'Threshold/Sensor_Two/Min/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() >= 63 ) {
        set(ref(database, 'Threshold/Sensor_Two/Min/Celsius'), 63.00);
      }
  });
  
  // Check if Threshold max has met Minimum Temp when in Fahrenheit Mode --> Sensor Two
  get(child(data, 'Threshold/Sensor_Two/Max/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() <= 14 ) {
        set(ref(database, 'Threshold/Sensor_Two/Max/Fahrenheit'), 14.00);
      }
  });
  
  // Check if Threshold min has met Minimum Temp when in Fahrenheit Mode --> Sensor Two
  get(child(data, 'Threshold/Sensor_Two/Min/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() <= 14 ) {
        set(ref(database, 'Threshold/Sensor_Two/Min/Fahrenheit'), 14.00);
      }
  });
  
  // Check if Threshold max has met Minimum Temp when in Celsius Mode --> Sensor Two
  get(child(data, 'Threshold/Sensor_Two/Max/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() <= -10 ) {
        set(ref(database, 'Threshold/Sensor_Two/Max/Celsius'), -10.00);
      }
  });
  
  // Check if Threshold min has met Minimum Temp when in Celsius Mode --> Sensor Two
  get(child(data, 'Threshold/Sensor_Two/Min/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() <= -10 ) {
        set(ref(database, 'Threshold/Sensor_Two/Min/Celsius'), -10.00);
      }
  });
  
  /* Check if celsius temperature is --> -999
     Update the GUI, and call function to update chart 
     Sensor One */
  get(child(data, 'Temp/Sensor_One/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() == -999.00 ) {
        if (powerMain == true) {
          tempSensorOne.innerText = "Unplugged";
          tempSensorOne.style.fontSize = "40px";
        }
        updateOneCelsius(-999);
      }
  });
  
  /* Check if celsius temperature is --> -999
     Update the GUI, and call function to update chart 
     Sensor Two */
  get(child(data, 'Temp/Sensor_Two/Celsius')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() == -999.00 ) {
         if (powerMain == true) {
           tempSensorTwo.innerText = "Unplugged";
           tempSensorTwo.style.fontSize = "40px";
         }
         updateTwoCelsius(-999);
      }
  });
  
  /* Check if fahrenheit temperature is --> -999
     Update the GUI, and call function to update chart 
     Sensor One */
  get(child(data, 'Temp/Sensor_One/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() == -999 ) {
        if (powerMain == true) {
          tempSensorOne.innerText = "Unplugged";
          tempSensorOne.style.fontSize = "40px";
        }
        updateOneFahrenheit(-999);
      }
  });
  
  /* Check if sensor is off, if so updarte chart with null values
     and display on GUI */
  get(child(data, 'Sensors/Sensor_One')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() == "Off" ) {
        if (disconnectedOne == false){
          if (powerMain == true) {
            tempSensorOne.innerText = "Not Available";
            tempSensorOne.style.fontSize = "40px";
          }
        }
        disconnectOne.textContent = 'POWER ON';
        updateOneCelsius(1000);
        updateOneFahrenheit(1000);
        powerOne = false;
      }
  });
  
   /* Check if sensor is active, if so then update variables */
  get(child(data, 'Sensors/Sensor_One')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() == "Active" ) {
        //tempSensorOne.innerText = "Powered On";
        //tempSensorOne.style.fontSize = "40px";
        disconnectOne.textContent = 'POWER OFF';
        powerOne = true;
        if (disconnectedOne == false){
          if (sensorOneMode == "°C"){
            if (powerMain == true) {
              tempSensorOne.innerText = celsiusOne + "°C";
              tempSensorOne.style.fontSize = "70px";
            }
          }
          else if (sensorOneMode == "°F"){
            if (powerMain == true) {
              tempSensorOne.innerText = fahrenheitOne + "°F";
              tempSensorOne.style.fontSize = "70px";
            }
          }
        }
      }
  });
  
   /* Check if sensor is off, if so updarte chart with null values
     and display on GUI */
  get(child(data, 'Sensors/Sensor_Two')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() == "Off" ) {
        if (disconnectedTwo == false){
          if (powerMain == true) {
            tempSensorTwo.innerText = "Not Available";
            tempSensorTwo.style.fontSize = "40px";
          }
        }
        disconnectTwo.textContent = 'POWER ON';
        updateTwoCelsius(1000);
        updateTwoFahrenheit(1000);
        powerTwo = false;
      }
  });
  
  /* Check if sensor is active, if so then update variables */
  get(child(data, 'Sensors/Sensor_Two')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() == "Active" ) {
        //tempSensorOne.innerText = "Powered On";
        //tempSensorOne.style.fontSize = "40px";
        disconnectTwo.textContent = 'POWER OFF';
        powerTwo = true;
        if (disconnectedTwo == false){
          if (sensorTwoMode == "°C"){
            if (powerMain == true) {
              tempSensorTwo.innerText = celsiusTwo + "°C";
              tempSensorTwo.style.fontSize = "70px";
            }
          }
          else if (sensorTwoMode == "°F"){
            if (powerMain == true){
              tempSensorTwo.innerText = fahrenheitTwo + "°F";
              tempSensorTwo.style.fontSize = "70px";
            }
          }
        }
      }
  });
  
  /* Check if fahrenheit temperature is --> -999
     Update the GUI, and call function to update chart 
     Sensor Two */
  get(child(data, 'Temp/Sensor_Two/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() == -999 ) {
        if (powerMain == true){
          tempSensorTwo.innerText = "Unplugged";
          tempSensorTwo.style.fontSize = "40px";
        }
        updateTwoFahrenheit(-999);
      }
  });
  
  // Check if Sensor One Min Threshold is met --> Then Send Email
  if (emailNotificationSentOne == false && disconnectedOne == false) {
    if (celsiusOne < currentOneMin && celsiusOne != -999){
      console.log("One");
      emailNotificationSentOne = true;
      message = oneMinMessage;
      console.log("SEND EMAIL MAX");
      sendEmail();
    }
  }
  
  // Check if Sensor One Max Threshold is met --> Then Send Email
  if (emailNotificationSentOne == false && disconnectedOne == false) {
    if (celsiusOne > currentOneMax){
      console.log("One");
      emailNotificationSentOne = true;
      message = oneMaxMessage;
      console.log("SEND EMAIL MAX");
      sendEmail();
    }
  }
  
  // Check if Sensor Two Min Threshold is met --> Then Send Email
  if (emailNotificationSentTwo == false && disconnectedTwo == false) {
    if (celsiusTwo < currentTwoMin && celsiusTwo != -999){
      console.log("MAX");
      emailNotificationSentTwo = true;
      message = twoMinMessage;
      console.log("SEND EMAIL MAX");
      sendEmail();
    }
  }
  
  // Check if Sensor Two Max Threshold is met --> Then Send Email
  if (emailNotificationSentTwo == false && disconnectedTwo == false) {
    if (celsiusTwo > currentTwoMax){
      console.log("MAX");
      emailNotificationSentTwo = true;
      message = twoMaxMessage;
      console.log("SEND EMAIL MAX");
      sendEmail();
    }
  }
  
  // Reset email function for Sensor One once temp is back in bounds of threshold
  if (emailNotificationSentOne == true && disconnectedOne == false) {
    if (currentOneMax >= celsiusOne && celsiusOne >= currentOneMin){
      console.log("RESET One");
      emailNotificationSentOne = false;
    }
  }
  
  // Reset email function for Sensor Two once temp is back in bounds of threshold
  if (emailNotificationSentTwo == true && disconnectedTwo == false) {
    if (currentTwoMax >= celsiusTwo && celsiusTwo >= currentTwoMin){
      console.log("RESET TWO");
      emailNotificationSentTwo = false;
    }
  }
  
  // Checks is power to board is on by checking last viable timestamp
  if (powerTime < Date.now() - 2000) {
    tempSensorOne.innerText = "SYSTEM OFF";
    tempSensorOne.style.fontSize = "40px";
    tempSensorTwo.innerText = "SYSTEM OFF";
    tempSensorTwo.style.fontSize = "40px";
    updateOneCelsius(1000);
    updateOneFahrenheit(1000);
    updateTwoCelsius(1000);
    updateTwoFahrenheit(1000);
    powerMain = false;
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateOneCelsius
// Input: Float
// Procedure: Sensor One --> As data is transferred from the ESP32 to Firebase
//            then the following function will take the celsius value and store
//            the timestamp at which it was read. From there it check if the 
//            value is referencing a disconnected senor value, if not then  
//            update corresponding arrays to ensure chart is also being updated.
//            Call Function to Update Chart if in celsius mode at the end.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateOneCelsius(newValue) {
  const currentTime = Date.now();
  if (newValue == -999){
    newValue = null;
    disconnectedOne = true;
    //set(ref(database, "Sensors/Sensor_One"), "Disconnected");
  }
  else if (newValue == 1000) {
    newValue = null;
    powerOne = false;
  }
  else{
    disconnectedOne = false;
    //set(ref(database, "Sensors/Sensor_One"), "Active");
  }
  senseOne_Celsius.push({ value: newValue, timestamp: currentTime });

  senseOne_Celsius = senseOne_Celsius.filter(value => ((currentTime - value.timestamp)/1000) <= 300);
  celsiusOneData = senseOne_Celsius.map(item => ({x: String((currentTime - item.timestamp)/1000), y: item.value}));

  //console.log(celsiusOneData);
  //console.log(newValue);
  updateChartCelsius();
  
  //set(ref(database, 'Chart/sensorOne_Celsius'), senseOne_Celsius);
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateOneFahrenheit
// Input: Float
// Procedure: Sensor One --> As data is transferred from the ESP32 to Firebase 
//            then the following function will take the fahrenheit value and 
//            store the  timestamp at which it was read. From there it check
//            if the value is referencing a disconnected senor value, if not
//            then update corresponding arrays to ensure chart is also being
//            updated. Call Function to Update Chart if in fahrenheit mode at 
//            the end.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateOneFahrenheit(newValue) {
  const currentTime = Date.now();
  if (newValue == -999|| newValue == -1766.20){
    newValue = null;
    disconnectedOne = true;
    //set(ref(database, "Sensors/Sensor_One"), "Disconnected");
  }
  else if (newValue == 1000) {
    newValue = null;
    powerOne = false;
  }
  else{
    disconnectedOne = false;
    //set(ref(database, "Sensors/Sensor_One"), "Active");
  }
  senseOne_Fahrenheit.push({ value: newValue, timestamp: currentTime });
  
  senseOne_Fahrenheit = senseOne_Fahrenheit.filter(value => ((currentTime - value.timestamp)/1000) <= 300);
  fahrenheitOneData = senseOne_Fahrenheit.map(item => ({x: String((currentTime - item.timestamp)/1000), y: item.value}));
  
  //console.log(celsiusTwoData);
  updateChartFahrenheit();
  
  //set(ref(database, 'Chart/sensorOne_Fahrenheit'), senseOne_Fahrenheit);
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateTwoCelsius
// Input: Float
// Procedure: Sensor Two --> As data is transferred from the ESP32 to Firebase
//            then the following function will take the celsius value and store
//            the timestamp at which it was read. From there it check if the 
//            value is referencing a disconnected senor value, if not then  
//            update corresponding arrays to ensure chart is also being updated.
//            Call Function to Update Chart if in celsius mode at the end.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateTwoCelsius(newValue) {
  const currentTime = Date.now();
  if (newValue == -999){
    newValue = null;
    disconnectedTwo = true;
    //set(ref(database, "Sensors/Sensor_Two"), "Disconnected");
  }
  else if (newValue == 1000) {
    newValue = null;
    powerOne = false;
  }
  else{
    disconnectedTwo = false;
    //set(ref(database, "Sensors/Sensor_Two"), "Active");
  }
  senseTwo_Celsius.push({ value: newValue, timestamp: currentTime });
  
  senseTwo_Celsius = senseTwo_Celsius.filter(value => ((currentTime - value.timestamp)/1000) <= 300);
  celsiusTwoData = senseTwo_Celsius.map(item => ({x: String((currentTime - item.timestamp)/1000), y: item.value}));
  
  //console.log(celsiusTwoData);
  updateChartCelsius();
  
  //set(ref(database, 'Chart/sensorTwo_Celsius'), senseTwo_Celsius);
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateTwoFahrenheit
// Input: Float
// Procedure: Sensor Two --> As data is transferred from the ESP32 to Firebase 
//            then the following function will take the fahrenheit value and 
//            store the  timestamp at which it was read. From there it check
//            if the value is referencing a disconnected senor value, if not
//            then update corresponding arrays to ensure chart is also being
//            updated. Call Function to Update Chart if in fahrenheit mode at 
//            the end.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateTwoFahrenheit(newValue) {
  const currentTime = Date.now();
  if (newValue == -999 || newValue == -1766.20){
    newValue = null;
    disconnectedTwo = true;
    //set(ref(database, "Sensors/Sensor_Two"), "Disconnected");
  }
  else if (newValue == 1000) {
    newValue = null;
    powerOne = false;
  }
  else{
    disconnectedTwo = false;
    //set(ref(database, "Sensors/Sensor_Two"), "Active");
  }
  senseTwo_Fahrenheit.push({ value: newValue, timestamp: currentTime });
  
  senseTwo_Fahrenheit = senseTwo_Fahrenheit.filter(value => ((currentTime - value.timestamp)/1000) <= 300);
  fahrenheitTwoData = senseTwo_Fahrenheit.map(item => ({x: String((currentTime - item.timestamp)/1000), y: item.value}));
  
  //console.log(celsiusTwoData);
  updateChartFahrenheit();
  
  //set(ref(database, 'Chart/sensorTwo_Fahrenheit'), senseTwo_Fahrenheit);
}

/////////////////////////////////////////////////////////////////////////////////
// Name: dataSensorOneCelsius
// Input: None
// Procedure: The following call to the database, will constantly check for 
//            changes in the celsius value of Sensor One. If there is a change 
//            then update the GUI, and call function to place timestamp in 
//            hashmap.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
const dataSensorOneCelsius = ref(database, 'Temp/Sensor_One/Celsius');
onValue(dataSensorOneCelsius, (snapshot) => {
  const data = snapshot.val();
  celsiusOne = data;
  
  if (tempSensorOne && sensorOneMode == "°C") {
    if (powerMain == true){
      tempSensorOne.innerText = data + sensorOneMode;
    }
    tempSensorOne.style.fontSize = "70px";
  }
  updateOneCelsius(data);
  updateOneFahrenheit(celsiusToFahrenheit(data));
  //console.log("Realtime data: ", data);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: dataSensorOneFahrenheit
// Input: None
// Procedure: The following call to the database, will constantly check for 
//            changes in the fahrenheit value of Sensor One. If there is a 
//            change then update the GUI, and call function to place timestamp 
//            in hashmap.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
const dataSensorOneFahrenheit = ref(database, 'Temp/Sensor_One/Fahrenheit');
onValue(dataSensorOneFahrenheit, (snapshot) => {
  const data = snapshot.val();
  fahrenheitOne = data;
  
  if (tempSensorOne && sensorOneMode == "°F") {
    if (powerMain == true){
      tempSensorOne.innerText = data + sensorOneMode;
    }
    tempSensorOne.style.fontSize = "70px";
  }
  updateOneFahrenheit(data);
  updateOneCelsius(fahrenheitToCelsius(data));
  //console.log("Realtime data: ", data);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: updateDataForModeOne
// Input: None
// Procedure: The following function will update the GUI for Sensor One based
//            On the user selection of celsius ot fahrenheit
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateDataForModeOne() {
  updateOneThresholdForMode();
  if (sensorOneMode == "°C") {
    get(child(data, 'Temp/Sensor_One/Celsius')).then((snapshot) => {
      if (snapshot.exists()) {
        if (tempSensorOne && sensorOneMode == "°C") {
          if (powerMain == true){
            tempSensorOne.innerText = snapshot.val() + sensorOneMode;
            tempSensorOne.style.fontSize = "70px";
          }
        }
        //console.log(snapshot.val());
      }
    });
  }
  else {
    get(child(data, 'Temp/Sensor_One/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists()) {
        if (tempSensorOne && sensorOneMode == "°F") {
          if (powerMain == true){
            tempSensorOne.innerText = snapshot.val() + sensorOneMode;
            tempSensorOne.style.fontSize = "70px";
          }
        }
        //console.log(snapshot.val());
      }
    });
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: dataSensorTwoCelsius
// Input: None
// Procedure: The following call to the database, will constantly check for 
//            changes in the celsius value of Sensor Two. If there is a change 
//            then update the GUI, and call function to place timestamp in 
//            hashmap.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
const dataSensorTwoCelsiusTwo = ref(database, 'Temp/Sensor_Two/Celsius');
onValue(dataSensorTwoCelsiusTwo, (snapshot) => {
  const data = snapshot.val();
  celsiusTwo = data;
  
  if (tempSensorTwo && sensorTwoMode == "°C") {
    if (powerMain == true){
       tempSensorTwo.innerText = data + sensorTwoMode;
       tempSensorTwo.style.fontSize = "70px";
    }
  }
  updateTwoCelsius(data);
  updateTwoFahrenheit(celsiusToFahrenheit(data));
  
  //console.log("Realtime data: ", data);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: dataSensorTwoFahrenheit
// Input: None
// Procedure: The following call to the database, will constantly check for 
//            changes in the fahrenheit value of Sensor Two. If there is a 
//            change then update the GUI, and call function to place timestamp 
//            in hashmap.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
const dataSensorTwoFahrenheit = ref(database, 'Temp/Sensor_Two/Fahrenheit');
onValue(dataSensorTwoFahrenheit, (snapshot) => {
  const data = snapshot.val();
  fahrenheitTwo = data;
  
  if (tempSensorTwo && sensorTwoMode == "°F") {
    if (powerMain == true){
      tempSensorTwo.innerText = data + sensorTwoMode;
      tempSensorTwo.style.fontSize = "70px";
    }
  }
  updateTwoFahrenheit(data);
  updateTwoCelsius(fahrenheitToCelsius(data));
  
  //console.log("Realtime data: ", data);
});


/////////////////////////////////////////////////////////////////////////////////
// Name: updateDataForModeTwo
// Input: None
// Procedure: The following function will update the GUI for Sensor Two based
//            On the user selection of celsius ot fahrenheit
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateDataForModeTwo() {
  updateTwoThresholdForMode();
  if (sensorTwoMode == "°C") {
    get(child(data, 'Temp/Sensor_Two/Celsius')).then((snapshot) => {
      if (snapshot.exists()) {
        if (tempSensorTwo && sensorTwoMode == "°C") {
          if (powerMain == true){
            tempSensorTwo.innerText = snapshot.val() + sensorTwoMode;
            tempSensorTwo.style.fontSize = "70px";
          }
        }
        //console.log(snapshot.val());
      }
    });
  }
  else {
    get(child(data, 'Temp/Sensor_Two/Fahrenheit')).then((snapshot) => {
      if (snapshot.exists()) {
        if (tempSensorTwo && sensorTwoMode == "°F") {
          if (powerMain == true){
            tempSensorTwo.innerText = snapshot.val() + sensorTwoMode;
            tempSensorTwo.style.fontSize = "70px";
          }
        }
        //console.log(snapshot.val());
      }
    });
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateBackground
// Input: None
// Procedure: Turns Website Page from Dark to Light Mode
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateBackground() {
  let backgroundToggled = document.getElementById("backgroundToggled");
  let backgroundToggledColor = window.getComputedStyle(backgroundToggled);
  let backgroundToggledText = document.getElementById("toggleBackgroundText");
  const backgroundElement = document.querySelector('.background');
  if (backgroundToggledColor.backgroundColor == 'rgb(169, 169, 169)') {
    backgroundToggledText.style.marginTop = "2px";    
    backgroundToggledText.style.marginLeft = "4px";
    backgroundToggledText.textContent = '☾';
    backgroundElement.style.background = '#2d384a';
  }
  else {
    backgroundToggledText.style.marginTop = "0px";    
    backgroundToggledText.style.marginLeft = "3px";
    backgroundToggledText.textContent = '🔆';
    backgroundElement.style.background = '#9dabb3';
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: sendEmail
// Input: None
// Procedure: Give data to the server in order for it to process sendong the
//            email. Provides server with JSON object of data needed.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function sendEmail() {
  //console.log('EMAIL ' + emailNotificationSentOne);
  const emailData = {
    to: email, 
    subject: 'Thermosense Warning',
    text: message
  };

  fetch('/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });
}

/////////////////////////////////////////////////////////////////////////////////
// Name: powerMainBoard
// Input: None
// Procedure: Checks the power and sets timestamp for most recent data..
// Output: None
/////////////////////////////////////////////////////////////////////////////////
const powerMainBoard = ref(database, 'Power_Status');
onValue(powerMainBoard, (snapshot) => {
  const data = snapshot.val();
    powerTime = Date.now();
    powerMain = true;
});
/////////////////////////// Function Definition End /////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////SPACE BLOCK///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////// EventListner Definition Start /////////////////////////

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMinDown
// Input: mousedown
// Procedure: Clears Interval and Timeout. Then sets a 100ms timeout, 100ms
//            timeout is check if button is being held down or not. If not then 
//            only call function once, else call function continuously
// Fucnction Call: sensorOneMinDown
/////////////////////////////////////////////////////////////////////////////////
oneMinDown.addEventListener('mousedown', () => {
  clearTimeout(oneSinglePressTimeout);
  
  oneSinglePressTimeout = setTimeout(() => {
    oneIncrementInterval = setInterval(sensorOneMinDown, 1); 
  }, 100);
  
  sensorOneMinDown();
  
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMinDown
// Input: mouseup
// Procedure: Clears Interval and Timeout as user relases button.
/////////////////////////////////////////////////////////////////////////////////
oneMinDown.addEventListener('mouseup', () => {
  clearInterval(oneIncrementInterval);
  clearTimeout(oneSinglePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMinDown
// Input: mouseleave
// Procedure: Clears Interval and Timeout as user leaves button vicinity.
/////////////////////////////////////////////////////////////////////////////////
oneMinDown.addEventListener('mouseleave', () => {
  clearInterval(oneIncrementInterval);
  clearTimeout(oneSinglePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMinUp
// Input: mousedown
// Procedure: Clears Interval and Timeout. Then sets a 100ms timeout, 100ms
//            timeout is check if button is being held down or not. If not then 
//            only call function once, else call function continuously
// Fucnction Call: sensorOneMinUp
/////////////////////////////////////////////////////////////////////////////////
oneMinUp.addEventListener('mousedown', () => {
  clearTimeout(oneSinglePressTimeout);

  oneSinglePressTimeout = setTimeout(() => {
    oneIncrementInterval = setInterval(sensorOneMinUp, 1); 
  }, 100);

  sensorOneMinUp(); 
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMinUp
// Input: mouseup
// Procedure: Clears Interval and Timeout as user relases button.
/////////////////////////////////////////////////////////////////////////////////
oneMinUp.addEventListener('mouseup', () => {
  clearInterval(oneIncrementInterval);
  clearTimeout(oneSinglePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMinUp
// Input: mouseleave
// Procedure: Clears Interval and Timeout as user leaves button vicinity.
/////////////////////////////////////////////////////////////////////////////////
oneMinUp.addEventListener('mouseleave', () => {
  clearInterval(oneIncrementInterval);
  clearTimeout(oneSinglePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMaxDown
// Input: mousedown
// Procedure: Clears Interval and Timeout. Then sets a 100ms timeout, 100ms
//            timeout is check if button is being held down or not. If not then 
//            only call function once, else call function continuously
// Fucnction Call: sensorOneMaxDown
/////////////////////////////////////////////////////////////////////////////////
oneMaxDown.addEventListener('mousedown', () => {
  clearTimeout(oneSinglePressTimeout);
  oneSinglePressTimeout = setTimeout(() => {
    oneIncrementInterval = setInterval(sensorOneMaxDown, 1); 
  }, 100);
  
  sensorOneMaxDown();
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMaxDown
// Input: mouseup
// Procedure: Clears Interval and Timeout as user relases button.
/////////////////////////////////////////////////////////////////////////////////
oneMaxDown.addEventListener('mouseup', () => {
  clearInterval(oneIncrementInterval);
  clearTimeout(oneSinglePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMaxDown
// Input: mouseleave
// Procedure: Clears Interval and Timeout as user leaves button vicinity.
/////////////////////////////////////////////////////////////////////////////////
oneMaxDown.addEventListener('mouseleave', () => {
  clearInterval(oneIncrementInterval);
  clearTimeout(oneSinglePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMaxUp
// Input: mousedown
// Procedure: Clears Interval and Timeout. Then sets a 100ms timeout, 100ms
//            timeout is check if button is being held down or not. If not then 
//            only call function once, else call function continuously
// Fucnction Call: sensorOneMaxUp
/////////////////////////////////////////////////////////////////////////////////
oneMaxUp.addEventListener('mousedown', () => {
  clearTimeout(oneSinglePressTimeout);
  oneSinglePressTimeout = setTimeout(() => {
    oneIncrementInterval = setInterval(sensorOneMaxUp, 1); 
  }, 100);
  
  sensorOneMaxUp();
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMaxUp
// Input: mouseup
// Procedure: Clears Interval and Timeout as user relases button.
/////////////////////////////////////////////////////////////////////////////////
oneMaxUp.addEventListener('mouseup', () => {
  clearInterval(oneIncrementInterval);
  clearTimeout(oneSinglePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMaxUp
// Input: mouseleave
// Procedure: Clears Interval and Timeout as user leaves button vicinity.
/////////////////////////////////////////////////////////////////////////////////
oneMaxUp.addEventListener('mouseleave', () => {
  clearInterval(oneIncrementInterval);
  clearTimeout(oneSinglePressTimeout);
});


/////////////////////////////////////////////////////////////////////////////////
// Name: twoMinDown
// Input: mousedown
// Procedure: Clears Interval and Timeout. Then sets a 100ms timeout, 100ms
//            timeout is check if button is being held down or not. If not then 
//            only call function once, else call function continuously
// Fucnction Call: sensorTwoMinDown
/////////////////////////////////////////////////////////////////////////////////
twoMinDown.addEventListener('mousedown', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
  singlePressTimeout = setTimeout(() => {
    incrementInterval = setInterval(sensorTwoMinDown, 1);
  }, 100);
  
  sensorTwoMinDown();
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMinDown
// Input: mouseup
// Procedure: Clears Interval and Timeout as user relases button.
/////////////////////////////////////////////////////////////////////////////////
twoMinDown.addEventListener('mouseup', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMinDown
// Input: mouseleave
// Procedure: Clears Interval and Timeout as user leaves button vicinity.
/////////////////////////////////////////////////////////////////////////////////
twoMinDown.addEventListener('mouseleave', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMinUp
// Input: mousedown
// Procedure: Clears Interval and Timeout. Then sets a 100ms timeout, 100ms
//            timeout is check if button is being held down or not. If not then 
//            only call function once, else call function continuously
// Fucnction Call: sensorTwoMinUp
/////////////////////////////////////////////////////////////////////////////////
twoMinUp.addEventListener('mousedown', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
  singlePressTimeout = setTimeout(() => {
    incrementInterval = setInterval(sensorTwoMinUp, 1);
  }, 100);
  
  sensorTwoMinUp();
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMinUp
// Input: mouseup
// Procedure: Clears Interval and Timeout as user relases button.
/////////////////////////////////////////////////////////////////////////////////
twoMinUp.addEventListener('mouseup', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMinUp
// Input: mouseleave
// Procedure: Clears Interval and Timeout as user leaves button vicinity.
/////////////////////////////////////////////////////////////////////////////////
twoMinUp.addEventListener('mouseleave', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMaxDown
// Input: mousedown
// Procedure: Clears Interval and Timeout. Then sets a 100ms timeout, 100ms
//            timeout is check if button is being held down or not. If not then 
//            only call function once, else call function continuously
// Fucnction Call: sensorTwoMaxDown
/////////////////////////////////////////////////////////////////////////////////
twoMaxDown.addEventListener('mousedown', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
  singlePressTimeout = setTimeout(() => {
    incrementInterval = setInterval(sensorTwoMaxDown, 1);
  }, 100);
  
  sensorTwoMaxDown();
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMaxDown
// Input: mouseup
// Procedure: Clears Interval and Timeout as user relases button.
/////////////////////////////////////////////////////////////////////////////////
twoMaxDown.addEventListener('mouseup', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMaxDown
// Input: mouseleave
// Procedure: Clears Interval and Timeout as user leaves button vicinity.
/////////////////////////////////////////////////////////////////////////////////
twoMaxDown.addEventListener('mouseleave', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMaxUp
// Input: mousedown
// Procedure: Clears Interval and Timeout. Then sets a 100ms timeout, 100ms
//            timeout is check if button is being held down or not. If not then 
//            only call function once, else call function continuously
// Fucnction Call: sensorTwoMaxUp
/////////////////////////////////////////////////////////////////////////////////
twoMaxUp.addEventListener('mousedown', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
  singlePressTimeout = setTimeout(() => {
    incrementInterval = setInterval(sensorTwoMaxUp, 1);
  }, 100);
  
  sensorTwoMaxUp();
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMaxUp
// Input: mouseup
// Procedure: Clears Interval and Timeout as user relases button.
/////////////////////////////////////////////////////////////////////////////////
twoMaxUp.addEventListener('mouseup', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMaxUp
// Input: mouseleave
// Procedure: Clears Interval and Timeout as user leaves button vicinity.
/////////////////////////////////////////////////////////////////////////////////
twoMaxUp.addEventListener('mouseleave', () => {
  clearInterval(incrementInterval);
  clearTimeout(singlePressTimeout);
});

/////////////////////////////////////////////////////////////////////////////////
// Name: modeSensorOne
// Input: click
// Procedure: Sets Mode for Sensor One to clesius or fahrenheit
// Fucnction Call: updateDataForModeOne
/////////////////////////////////////////////////////////////////////////////////
modeSensorOne.addEventListener('click', () => {
  if (sensorOneMode == "°C") {
    sensorOneMode = "°F";
  } 
  else {
    sensorOneMode = "°C";
  }
  
  updateDataForModeOne();
  
  modeSensorOne.innerText = sensorOneMode;
  
  //console.log("Update button pressed!");
});

/////////////////////////////////////////////////////////////////////////////////
// Name: modeSensorTwo
// Input: click
// Procedure: Sets Mode for Sensor Two to clesius or fahrenheit
// Fucnction Call: updateDataForModeTwo
/////////////////////////////////////////////////////////////////////////////////
modeSensorTwo.addEventListener('click', () => {
  if (sensorTwoMode == "°C") {
    sensorTwoMode = "°F";
  } 
  else {
    sensorTwoMode = "°C";
  }
  
  updateDataForModeTwo();
  
  modeSensorTwo.innerText = sensorTwoMode;
  
  //console.log("Update button pressed!");
});

/////////////////////////////////////////////////////////////////////////////////
// Name: updateEmail
// Input: click
// Procedure: Get value from email input
// Fucnction Call: None
/////////////////////////////////////////////////////////////////////////////////
updateEmail.addEventListener('click', () => {
  
  email = emailInput.value;
  console.log(email);
  
  //set(ref(database, "Email"), email);
  
  emailInput.value = "";
  
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMinMessageText
// Input: click
// Procedure: Get value from Min Sensor One Input
// Fucnction Call: None
/////////////////////////////////////////////////////////////////////////////////
oneMinMessageText.addEventListener('click', () => {
  
  oneMinMessage = oneMinText.value;
  
  //set(ref(database, "Threshold/Sensor_One/Min/Message"), oneMinMessage);
  
  oneMinText.value = "";
  
});

/////////////////////////////////////////////////////////////////////////////////
// Name: oneMaxMessageText
// Input: click
// Procedure: Get value from Max Sensor One Input
// Fucnction Call: None
/////////////////////////////////////////////////////////////////////////////////
oneMaxMessageText.addEventListener('click', () => {
  
  oneMaxMessage = oneMaxText.value;
  
  //set(ref(database, "Threshold/Sensor_One/Max/Message"), oneMaxMessage);
  
  oneMaxText.value = "";
  
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMinMessageText
// Input: click
// Procedure: Get value from Min Sensor Two Input
// Fucnction Call: None
/////////////////////////////////////////////////////////////////////////////////
twoMinMessageText.addEventListener('click', () => {
  
  twoMinMessage = twoMinText.value;
  
  //set(ref(database, "Threshold/Sensor_Two/Min/Message"), twoMinMessage);
  
  twoMinText.value = "";
  
});

/////////////////////////////////////////////////////////////////////////////////
// Name: twoMaxMessageText
// Input: click
// Procedure: Get value from Max Sensor Two Input
// Fucnction Call: None
/////////////////////////////////////////////////////////////////////////////////
twoMaxMessageText.addEventListener('click', () => {
  
  twoMaxMessage = twoMaxText.value;
  
  //set(ref(database, "Threshold/Sensor_Two/Max/Message"), twoMaxMessage);
  
  twoMaxText.value = "";
  
});

/////////////////////////////////////////////////////////////////////////////////
// Name: disconnectOne
// Input: click
// Procedure: Power Sensor One the data from entering the site, 
//            mimick physical power (Connect also possible if via GUI)
// Fucnction Call: None
/////////////////////////////////////////////////////////////////////////////////
disconnectOne.addEventListener('click', () => {
  if (powerOne == true) {
    set(ref(database, "Sensors/Sensor_One"), "Off");
    tempSensorOne.innerText = "Not Available";
    tempSensorOne.style.fontSize = "40px";
    if (powerMain == true){
      disconnectOne.textContent = 'POWER ON';
    }
    powerOne = false; 
  }
  else if (powerOne == false){
    set(ref(database, "Sensors/Sensor_One"), "Active");
    if (powerMain == true){
      disconnectOne.textContent = 'POWER OFF';
    }
    powerOne = true;
  }
});

/////////////////////////////////////////////////////////////////////////////////
// Name: disconnectTwo
// Input: click
// Procedure: Power Sensor Two the data from entering the site, 
//            mimick physical power off (Connect also possible if via GUI)
// Fucnction Call: None
/////////////////////////////////////////////////////////////////////////////////
disconnectTwo.addEventListener('click', () => {
  if (powerTwo == true) {
    set(ref(database, "Sensors/Sensor_Two"), "Off");
    tempSensorTwo.innerText = "Not Available";
    tempSensorTwo.style.fontSize = "40px";
    if (powerMain == true){
      disconnectTwo.textContent = 'POWER ON';
    }
    powerTwo = false; 
  }
  else if (powerTwo == false){
    set(ref(database, "Sensors/Sensor_Two"), "Active");
    if (powerMain == true){
      disconnectTwo.textContent = 'POWER OFF';
    }
    powerTwo = true;
  }
});

////////////////////////// EventListner Definition End //////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////SPACE BLOCK///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////// Chart Functionality Start ////////////////////////////

// Chart Input  
var realTime_Chart = document.getElementById('myChart').getContext('2d');

// Chart Slider --> Celsius or Fahrenheit
let chartInput = document.getElementById('chartInput');

/////////////////////////////////////////////////////////////////////////////////
// Name: myChart
// Procedure: Sets the default values of the chart, two sensors, x (seconds),
//            y (celsius or fahrenheit).
/////////////////////////////////////////////////////////////////////////////////
var myChart = new Chart(realTime_Chart, {
    type: 'line', // Line Graph
    data: {
        datasets: [{
            label: 'Sensor One', // Line One
            data: celsiusOneData, // Initial Data
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            pointRadius: 0 // No Points
        },
        {   label: 'Sensor Two', // Line Two
            data: celsiusTwoData, // Initial Data
            backgroundColor: 'rgba(255, 165, 0, 0.2)',
            borderColor: 'rgba(255, 165, 0, 1)',
            borderWidth: 1,
            pointRadius: 0 // No Points
        }
                  ]

    },
    options: {
        animation: false, // No animation from 0 to value
        scales: {
            x: {
                type: 'linear', // Straight line
                beginAtZero: true, // Start line at this point
                position: 'bottom',
                min: 0, // Set minimum y value to 0
                max: 300, // Set minimum y value to 300
                reverse: true, // Revers the order on x-axis
                title: {
                    display: true, // display title
                    text: 'Seconds (s)' // Title for the y-axis
                },
                ticks: {
                    stepSize: 10 // Define the interval for ticks
                },

            },
            y: {
                beginAtZero: true, // Start Line at this point
                position: 'right', // Place on right side of x-axis
                min: 10, // Set minimum y value to 10
                max: 50, // Set maximum y value to 50
                title: {
                    display: true, // display title
                    text: 'Temperature (°C)' // Title for the y-axis
                },
                ticks: {
                    stepSize: 5 // Define interval for ticks
                }
            }
        }
    }
});

/////////////////////////////////////////////////////////////////////////////////
// Name: chartCelsiusToFahrenheit
// Input: None
// Procedure: The following updates the chart to go to fahrenheit values on the 
//            y axis and labels the y axis accordingly
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function chartCelsiusToFahrenheit() {
  myChart.options.scales.y.title = {
    display: true,
    text: "Temperature (°F)"
  };

  myChart.options.scales.y.min = 50;
  myChart.options.scales.y.max = 122;
  // Update the chart
  myChart.update();
}

/////////////////////////////////////////////////////////////////////////////////
// Name: chartFahrenheitToCelsius
// Input: None
// Procedure: The following updates the chart to go to celsius values on the 
//            y axis and labels the y axis accordingly
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function chartFahrenheitToCelsius() {
  myChart.options.scales.y.title = {
  display: true,
  text: "Temperature (°C)"
  };
  myChart.options.scales.y.min = 10;
  myChart.options.scales.y.max = 50;
  // Update the chart

  myChart.update();
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateChartCelsius
// Input: None
// Procedure: The following updates the chart with the most recent celsius data
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateChartCelsius() {
  if (chartCelsius == true && chartFahrenheit == false){
    myChart.data.datasets[0].data = [];
    myChart.data.datasets[0].data.push(...celsiusOneData);

    myChart.data.datasets[1].data = [];
    myChart.data.datasets[1].data.push(...celsiusTwoData);
  
    myChart.update();
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateChartFahrenheit
// Input: None
// Procedure: The following updates the chart with the most recent fahrenheit 
//            data
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateChartFahrenheit() {
  if (chartCelsius == false && chartFahrenheit == true){
    myChart.data.datasets[0].data = [];
    myChart.data.datasets[0].data.push(...fahrenheitOneData);

    myChart.data.datasets[1].data = [];
    myChart.data.datasets[1].data.push(...fahrenheitTwoData);

    myChart.update();
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: updateChart
// Input: boolean
// Procedure: The following updates the chart by calling the correct functions
//            based on if the chart is in celsius or fahrenheit mode.
// Output: None
/////////////////////////////////////////////////////////////////////////////////
function updateChart(checked) {
  let chartToggled = document.getElementById("chartToggled");
  let chartToggledColor = window.getComputedStyle(chartToggled);
  let chartToggledText = document.getElementById("chartToggledText");
  chartToggledText.style.marginTop = "2px";    
  chartToggledText.style.marginLeft = "2px";
  if (!checked) {
    chartToggledText.textContent = '°C';
    chartCelsius = true;
    chartFahrenheit = false;
    chartFahrenheitToCelsius();
  }
  else if (checked) {
    chartToggledText.textContent = '°F';
    chartCelsius = false;
    chartFahrenheit = true;
    chartCelsiusToFahrenheit();
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Name: chartInput
// Input: change
// Procedure: Calls update Chart based on where slider is located on GUI
// Fucnction Call: None
/////////////////////////////////////////////////////////////////////////////////
chartInput.addEventListener('change', function() {
  updateChart(this.checked);
});

////////////////////////// Chart Functionality End //////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////SPACE BLOCK///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Set Interval For Functtion checkBoundaries. --> Runs Every 1ms
setInterval(checkBoundaries, 1);

// Constantly check if backkground toggle is hit
setInterval(updateBackground, 1);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////SPACE BLOCK///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
