/**
 * Created by GeVr on 2/01/2015.
 */
winston = require('winston');
SerialPort = require("serialport").SerialPort;
serialport = require("serialport");

function Interpreter() {
    self = this;
    this.serialPort = new SerialPort("/dev/ttyAMA0", {
        baudrate: 115200,
        parser: serialport.parsers.readline("\r")
    }, false); // this is the openImmediately flag [default is true]
    this.serialBuffer = new Buffer(32);

    this.serialPort.open(function (error) {
        if ( error ) {
            winston.warn('failed to open: '+error);
        } else {
            winston.info('opened serial connection to microcontroller');
            self.serialPort.on('data', function(data) {
                self.serialCallback(data);
            });

        }

    });
};

Interpreter.prototype.message = function(target, command, parameter, value) {
    self = this;
    self.serialBuffer.fill("0");
    self.serialBuffer.write(target, 0, 4); //write the destination address
    if(command == "command") {
        self.serialBuffer.write("COMD", 4,4); //message type

    } else if (command == "request") {
        self.serialBuffer.write("REQT", 4,4);
    }
    self.serialBuffer.write(parameter, 8, 4); //parameter
    self.serialBuffer.write(value, 12); //value, undefined length, message length = max 28 (32 - address)
    self.serialPort.write(self.serialBuffer);
    winston.info("contents of serialBuffer: " + self.serialBuffer.toString());
}

Interpreter.prototype.setCallback = function(callback) {
    this.serialCallback = callback;
}



module.exports = Interpreter;