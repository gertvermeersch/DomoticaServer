/**
 * Created by GeVr on 4/01/2015.
 */
var RestServer = require("./RESTserver.js");
var Interpreter = require('./util/interpreter.js');
var ClimateController = require('./util/ClimateController.js');

var config = [
    {   description: "Turn twilight on",
        path: "/living/twilight/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "1"
        },
        room: "living",
        device: "twilight",
        state : true
    },
    {   description: "Turn twilight off",
        path: "/living/twilight/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "1"
        },
        room: "living",
        device: "twilight",
        state : false
    },
    {   description: "Turn scent on",
        path: "/bedroom/scent/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "5"
        },
        room: "bedroom",
        device: "scent",
        state : true
    },
    {   description: "Turn scent off",
        path: "/bedroom/scent/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "5"
        },
        room: "bedroom",
        device: "scent",
        state : false
    },
    {   description: "Turn desk light on",
        path: "/living/desklight/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "3"
        },
        room: "living",
        device: "desklight",
        state : true
    },
    {   description: "Turn desklight off",
        path: "/living/desklight/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "3"
        },
        room: "living",
        device: "desklight",
        state : false
    },
    {   description: "Turn salt lamp on",
        path: "/bedroom/saltlamp/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "4"
        },
        room: "bedroom",
        device: "saltlamp",
        state : true
    },
    {   description: "Turn salt lamp off",
        path: "/bedroom/saltlamp/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "4"
        },
        room: "bedroom",
        device: "saltlamp",
        state : false
    },
    {   description: "Turn uplighter on",
        path: "/living/uplighter/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "2"
        },
        room: "living",
        device: "uplighter",
        state : true
    },
    {   description: "Turn uplighter off",
        path: "/living/uplighter/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "2"
        },
        room: "living",
        device: "uplighter",
        state : false
    },
    {   description: "Turn twilights on",
        path: "/living/twilights/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "0"
        },
        room: "living",
        device: "twilights",
        state : true
    },
    {   description: "Turn twilights off",
        path: "/living/twilights/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "0"
        },
        room: "living",
        device: "twilights",
        state : false
    },



];

var port    =  '8443';
var serialPortDevice = '/dev/ttyAMA0';
var states =  { //share states between interpreter and server
	    living: {
	        uplighter: false,
	        twilight: false,
	        twilights: false,
	        desklight: false
	        
	    },
	    bedroom: {
	        saltlamp: false,
	        scent: false
	    },
		shut_off: false,
		at_home: false,
		target_temperature: 0,
		temperature: 0,
		humidity: 0,
		heating_state:false
	}; 


/*initialize the serial port */
var _interpreter = new Interpreter(serialPortDevice, states);
var _climateController = new ClimateController(_interpreter, states);

/*initialize the server */

serverInstance = new RestServer(port, _interpreter, _climateController, config, states);

