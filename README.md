# Thermo-Sense
![Screenshot 2024-10-11 at 1 25 05 PM](https://github.com/user-attachments/assets/6403fef4-9db7-42f4-915d-05ddaa8a624f)

## Demo
[![IMG_6819](https://github.com/user-attachments/assets/3df658d3-707c-4294-ad57-060d6c6ca117)](https://www.youtube.com/watch?v=SJX2lLAdwCI)

## User Interface
![image](https://github.com/user-attachments/assets/ba61466a-e970-492e-8041-4fc12cffaf60)
The following figure shows two sensors. Each sensor will be updated to showcase its current temperature reading. In the figure above the system is powered off thus both sensors show “System Off”. Each sensor can has a button that can toggle from Celsius or Fahrenheit. Each sensor has a max and min threshold that can be set by the user using the arrows. The email setting can be used to supply the script with an authentic email that will receive messages if a threshold is broken. 

![Screenshot 2024-10-11 at 1 25 27 PM](https://github.com/user-attachments/assets/939f449d-a940-48da-8590-9afcf414cfac)
The figure above showcases the real-time graph. A button can be used to toggle the chart from Fahrenheit to Celsius. The graph shows the last 300 seconds of data; thus, the following figure has no data collected within the last 300 seconds. 


## System Overview
![image](https://github.com/user-attachments/assets/4f4b52c2-a487-47ac-a2b3-6daa24903427)
1. ESP32: microcontroller used to control the entire circuit and has Wi-Fi connectivity, which is used for the website and send email updates 
2. OLED: Displays whether each sensor is on or off and the current temperature each sensor is recording. Receives data from the ESP32. 
3. Power Switch: On/off/on switch that controls the power flowing to the entire circuit. It has two switches inside that when open are off, but closed send power out into the circuit.  
4. Push Buttons: toggles whether each sensor is on or off. 
5. Disconnect: Used to easily connect/disconnect the sensors from the box. 
6. Cable: 2-meter extension that connects the sensor to the connectors for more distance. 
7. Temperature Sensors: takes the current temperature and transmits the data back to the ESP

## Wiring Schematic
![image](https://github.com/user-attachments/assets/e37f1899-d9ee-4792-8952-63eecc0f96ed)

## Software Schematic
![image](https://github.com/user-attachments/assets/5c9f9c80-0748-422f-a8e3-95713e6dd470)
