/**
 * Created by GeVr on 2/01/2015.
 */
winston = require('winston');
SerialPort = require("serialport").SerialPort;
serialport = require("serialport");

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({timestamp:true, prettyPrint:true, colorize: true, level: 'trace'}),
        new (winston.transports.File)({ filename: '/home/gert/domotica/serial.log' })
    ],
    levels: {
        trace: 0,
        input: 1,
        verbose: 2,
        prompt: 3,
        debug: 4,
        info: 5,
        data: 6,
        help: 7,
        warn: 8,
        error: 9
    },
    colors: {
        trace: 'magenta',
        input: 'grey',
        verbose: 'cyan',
        prompt: 'grey',
        debug: 'blue',
        info: 'green',
        data: 'grey',
        help: 'cyan',
        warn: 'yellow',
        error: 'red'
    }
});


function Interpreter(serialPortDevice, _states) {
	this._callbacks = new Array();
	this._states = _states;
    var self = this;
    self.serialPort = new SerialPort(serialPortDevice, {
        baudrate: 115200,
        parser: serialport.parsers.readline("\r")
    }, true); // this is the openImmediately flag [default is true]
    this.serialBuffer = new Buffer(32);
    this.serialPort.on('data', function(data) {
        self.onData(data);
    })
    
    this.serialPort.on('open', function(error) {self.onSerialReady(error)});
};

Interpreter.prototype.onSerialReady = function(error) {
    var self = this;
    if ( error ) {
        logger.error('failed to open: ' + error);
    } else {

        logger.info('opened serial connection to micro controller');
        //refresh _states
        self.message("wwww", "request", "TEMP", "");
        setTimeout(function() {
            self.message("0000", "request", "SWST", "0");
            setTimeout(function () {
                self.message("0000", "request", "SWST", "1");
                setTimeout(function () {
                    self.message("0000", "request", "SWST", "2");
                    setTimeout(function () {
                        self.message("0000", "request", "SWST", "3");
                        setTimeout(function () {
                            self.message("0000", "request", "SWST", "4");
                            setTimeout(function () {
                                self.message("0000", "request", "SWST", "5");
                                setInterval(function () {
                                    self.message("wwww", "request", "TEMP", "");
                                }, 60000);
                                setTimeout(function() {
                                	setInterval(function() {
                                		self.message("wwww", "request", "HUMY", "");
                                	}, 60000);
                                },2000);
                                setTimeout(function() {
                                	setInterval(function() {
                                		self.message("wwww", "request", "TTMP", "");
                                	}, 60000);
                                },4000);
                                setTimeout(function() {
                                	setInterval(function() {
                                		self.message("wwww", "request", "HEAT", "");
                                	}, 60000);
                                },6000);
                                
                            }, 1000);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);


    }
}

Interpreter.prototype.setStates = function(states) {
    this._states = states;
}

Interpreter.prototype.onData = function(line) {
    line = line.toString().replace(/\W/g, ''); //strip all the garbage
    logger.info("Serial data received: " + line);
    //here we will translate serial message into JSON messages

    var source = line.substr(0, 4);
    var type = line.substr(4,4);
    var param = line.substr(8,4);
    var value = line.substr(12);

    var response = this._states;

    if(type === "STAT") {
        logger.info("Status update received");
        if(source === "0000") {
           //logger.info("from RF433Mhz");
            if(param === "SWST" ) {
             //   logger.info("Switch state");
                var state = (value.substr(1,1) === "1")?true:false;
               // logger.info("state: " + state);
                switch(value.substr(0,1)) {
                    case "1":
                        //logger.info("twilight");
                        response.living.twilight = state;
                        break;
                    case "2":
                        //logger.info("uplighter");
                        response.living.uplighter = state;
                        break;
                    case "0":
                        //logger.info("desklight");
                        response.living.desklight = state;
                        break;
                    case "3":
                        //logger.info("twilights");
                        response.living.twilights = state;
                        break;
                    case "4":
                    //logger.info("saltlamp");
                        response.bedroom.saltlamp = state;
                        break;
                    case "5":
                        //logger.info("twilights");
                        response.bedroom.scent = state;
                        break;
                    default:

                        break;
                }
            }

        }
        else if (param == "TEMP" && source == "wwww") {

            response.temperature = value.substr(0,2);
            logger.debug("temperature = " + response.temperature);
        }
        else if (param == "HUMY" && source == "wwww") {
            response.humidity = value.substr(0,2);
            logger.debug("humidity = " + response.humidity);
        }
        else if (param == "TTMP" && source == "wwww") {
            response.target_temperature = value.substr(0,2);
            logger.debug("target temperature = " + response.target_temperature);
        }
        else if (param == "HEAT" && source == "wwww") {
            response.heating_state = value.substr(0,1) == "1"?true:false;
            logger.debug("heating state = " + response.heating_state);
        }
        //console.log("interpreter states:");
        logger.info(JSON.stringify(this._states));
        this.notify();

    }
    else
        logger.info("serial data ignored - invalid data");

}

Interpreter.prototype.message = function(target, command, parameter, value) {
    self = this;

    self.serialBuffer.fill("0");
    self.serialBuffer.write(target, 0, 4); //write the destination address
    if(command == "command") {
        self.serialBuffer.write("COMD", 4,4); //message type

    } else if (command == "request") {
        self.serialBuffer.write("REQT", 4,4);
    } else if (command == "setvalue") {
        self.serialBuffer.write("SETV", 4,4);
    } else
        self.serialBuffer.write(command, 4, 4);

    self.serialBuffer.write(parameter, 8, 4); //parameter
    self.serialBuffer.write(value, 12); //value, undefined length, message length = max 28 (32 - address)

    self.serialPort.write(self.serialBuffer);
    logger.info("contents of serialBuffer: " + self.serialBuffer.toString());
}

Interpreter.prototype.notify = function() {
	for (i = 0; i < this._callbacks.length; i++) {
		this._callbacks[i]();
	}
	
}

Interpreter.prototype.addCallback = function(callback) {
    this._callbacks.push(callback);

}




module.exports = Interpreter;