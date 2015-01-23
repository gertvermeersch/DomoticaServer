# DomoticaServer
Node.js server for REST api to control my home automation project

I built an Arduino module that accepts commands from the UART interface and then executes the 
commands or forwards them to other nodes using an nRF905 radio transmitter or a simple 433Mhz AM transmitter. 
The module also receives radio messages and then forwards them to the UART. 
The Arduino's UART is connected with the UART on a Raspberry Pi GPIO header.

The messages between the Arduino and RPi are structured as followed:
<4 byte destination address for outbound RPi messages, 4 byte source address for outbound Arduino messages>
<4 byte message type (COMD, STAT, REQT) = command, status, request... the developer is free to choose his own types>
<4 byte parameter, eg. TEMP (temperature) SWON (switch on) SWST (switch state) etc>
<20 byte value, or free to use space>

It would be nice if the Arduino could understand JSON, but using drivers for 2 radio transmitters and creating a decision tree
in the Arduino code already uses up quite some resources. This is why I decided to create my own light-weight protocol.

I also created a frontend for this project using OpenUI5, also on GitHub.
