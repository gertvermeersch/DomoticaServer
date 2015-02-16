var fs = require('fs');
var winston = require('winston');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});
winston.add(winston.transports.File, {filename: "/home/gert/domotica/create_config.log"});

var default_config = { heating : {
			temperature_present: 20,
			temperature_away : 16,
			weekend_start_time: "09:00",
			weekend_stop_time: "23:00",
			week_start_morning: "07:00",
			week_end_morning: "09:00",
			week_start_evening: "16:00",
			week_end_evening: "22:00"			
	}};

function writeConfig() {
	fs.writeFile("heating.conf", JSON.stringify(default_config), function(error) {
		if(error)
			winston.error("Could not write config file: " + error);
		else {
			winston.info("Default config file written, please make sure it is in the root directory before running the main program");
		}
	})
}

writeConfig();