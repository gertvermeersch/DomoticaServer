/**
 * Created by GeVr on 2/01/2015.
 */
winston = require('winston');
SerialPort = require("serialport").SerialPort

function Interpreter() {
    self = this;
    this.serialPort = new SerialPort("/dev/ttyAMA0", {
        baudrate: 115200
    }, false); // this is the openImmediately flag [default is true]
    this.serialBuffer = new Buffer(32);

    this.serialPort.open(function (error) {
        if ( error ) {
            winston.warn('failed to open: '+error);
        } else {
            winston.info('opened serial connection to microcontroller');
            self.serialPort.on('data', function (data) {
                winston.info("serial data:", data.toString());
            });
        }

    });
};

Interpreter.prototype.message = function(target, command, parameter, value) {
    self = this;
    self.serialBuffer.write("00000000000000000000000000000000",0,32);
    self.serialBuffer.write(target, 0, 4); //write the destination address
    if(command == "command") {
        self.serialBuffer.write("COMD", 4,4); //message type
        self.serialBuffer.write(parameter, 8, 4); //parameter
        self.serialBuffer.write(value, 12); //value, undefined length, message length = max 28 (32 - address)
    } else if (command == "request") {
        self.serialBuffer.write("REQT", 4,4);
    }
    self.serialPort.write(self.serialBuffer);
    winston.info("contents of serialBuffer: " + self.serialBuffer.toString());
    self.serialBuffer.clear();

};

Interpreter.prototype.incomingMessage = function(callback) {

};

module.exports = Interpreter;