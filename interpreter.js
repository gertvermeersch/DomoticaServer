/**
 * Created by GeVr on 2/01/2015.
 */
winston = require('winston');
SerialPort = require("serialport").SerialPort;
serialport = require("serialport");

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});

function Interpreter() {
    var self = this;
    self.serialPort = new SerialPort("/dev/ttyAMA0", {
        baudrate: 115200,
        parser: serialport.parsers.readline("\r")
    }, true); // this is the openImmediately flag [default is true]
    this.serialBuffer = new Buffer(32);
    this.serialPort.on('data', function(data) {
        self.onData(data);
    })
};

Interpreter.prototype.setStates = function(states) {
    this.states = states;
}

Interpreter.prototype.onData = function(line) {
    line = line.toString().replace(/\W/g, ''); //strip all the garbage
    winston.info("Serial data received: " + line);
    //here we will translate serial message into JSON messages

    var source = line.substr(0, 4);
    var type = line.substr(4,4);
    var param = line.substr(8,4);
    var value = line.substr(12);

    var response = this.states;

    if(type === "STAT") {
        winston.info("Status update received");
        if(source === "0000") {
           //winston.info("from RF433Mhz");
            if(param === "SWST" ) {
             //   winston.info("Switch state");
                var state = (value.substr(1,1) === "1")?"on":"off";
               // winston.info("state: " + state);
                switch(value.substr(0,1)) {
                    case "1":
                        //winston.info("twilight");
                        response.living.twilight = state;
                        break;
                    case "2":
                        //winston.info("uplighter");
                        response.living.uplighter = state;
                        break;
                    case "0":
                        //winston.info("desklight");
                        response.living.desklight = state;
                        break;
                    case "3":
                        //winston.info("twilights");
                        response.living.twilights = state;
                        break;
                    case "4":
                    //winston.info("saltlamp");
                        response.bedroom.saltlamp = state;
                        break;
                    case "5":
                        //winston.info("twilights");
                        response.bedroom.scent = state;
                        break;
                    default:

                        break;
                }
            }

        }
        else if (param == "TEMP" && source == "wwww") {
            console.log("temperature = " + value);
            response.living.temperature = value.substr(0,2);
        }

        this.serialCallback();

    }
    else
        winston.info("serial data ignored - invalid data");

}

Interpreter.prototype.message = function(target, command, parameter, value) {
    self = this;

    self.serialBuffer.fill("0");
    self.serialBuffer.write(target, 0, 4); //write the destination address
    if(command == "command") {
        self.serialBuffer.write("COMD", 4,4); //message type

    } else if (command == "request") {
        self.serialBuffer.write("REQT", 4,4);
    } else
        self.serialBuffer.write(command, 4, 4);

    self.serialBuffer.write(parameter, 8, 4); //parameter
    self.serialBuffer.write(value, 12); //value, undefined length, message length = max 28 (32 - address)

    self.serialPort.write(self.serialBuffer);
    winston.info("contents of serialBuffer: " + self.serialBuffer.toString());
}

Interpreter.prototype.setCallback = function(callback) {
    this.serialCallback = callback;
}



module.exports = Interpreter;