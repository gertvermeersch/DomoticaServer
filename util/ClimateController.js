var winston = require('winston');
var fs = require('fs');

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({timestamp:true, prettyPrint:true, colorize: true, level: 'trace'}),
      new (winston.transports.File)({ filename: '/home/gert/domotica/climate_control.log' })
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


function ClimateController(interpreter, states) {
	this._interpreter = interpreter;
	this._states = states;
	var self = this;
	logger.info("Climate controller instance has started");
	logger.info("Trying to read the configuration file");
	this.readConfig(function(error, config) {
		if(error) {
			logger.warn("Error while reading the configuration file, a new file will be created");
			self.createConfig(function(error) {
				if(error) {
					throw new Error("Could not write configuration file -- exitting program");
				}else {
					self.readConfig(function(error) {
						if(error) throw error;
						self.configReadCallback(self);
					});
				}
			})
		}else {
			logger.info("Config file read: " + JSON.stringify(config));
			self._config = config;
			self.configReadCallback(self);
		}
	});


	
}

ClimateController.prototype.configReadCallback = function(controller) {
	//at startup set the correct target temperature, only do this after a config file is present
	logger.info("Config file is read, checking target temperature");

	controller.updateTargetTemperature();
	setInterval(function() {controller.updateTargetTemperature();}, 10000); //every 10 minutes

}

ClimateController.prototype.updateTargetTemperature = function() {
	var controller = this;
	logger.debug("Checking the target temperature");
	logger.debug(controller._states.target_temperature);

	var newValue = controller.getCurrentTargetTemperature();
	logger.debug(newValue);
	if(controller._states.target_temperature != newValue) {
		logger.debug("Target temperature update to " + newValue);
		//update target temperature
		controller._states.target_temperature = newValue;
		controller._interpreter.message("wwww", "setvalue", "TTMP", controller._states.target_temperature);
	}else
		logger.debug("Target temperature still ok");
}


ClimateController.prototype.getConfig = function() {
	return this._config;
}


ClimateController.prototype.readConfig = function(callback) {
	try {
		fs.readFile("heating.conf", function(error, data) {
			if(error) {
				callback(error);
			}
			else {
				callback(null, JSON.parse(data));
			}
		})
	}catch(ex) {
		callback(ex);
	}
	
};

ClimateController.prototype.createConfig = function(callback) {
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
	fs.writeFile("heating.conf", JSON.stringify(default_config), function(error) {
		if(error) {
			logger.error("Could not write config file: " + error);
			callback(error);
		}
		else {
			logger.info("Default config file written");
			callback();
		}
	})
};

ClimateController.prototype.updateConfig = function(newConfig, callback) {

	try {
		logger.info("Payload received: " + JSON.stringify(newConfig));
		//var _newConfig = JSON.parse(newConfig);
		this._config.heating.temperature_away = newConfig.heating.temperature_away;
		this._config.heating.temperature_present = newConfig.heating.temperature_present;
		this._config.heating.weekend_start_time = newConfig.heating.weekend_start_time;
		this._config.heating.weekend_stop_time = newConfig.heating.weekend_stop_time;
		this._config.heating.week_start_morning = newConfig.heating.week_start_morning;
		this._config.heating.week_end_morning = newConfig.heating.week_end_morning;
		this._config.heating.week_start_evening = newConfig.heating.week_start_evening;
		this._config.heating.week_end_evening = newConfig.heating.week_end_evening;
		logger.info("New values: " + JSON.stringify(this._config));
		fs.writeFile("heating.conf", JSON.stringify(this._config), function(error) {
			if(error) {
				logger.error("Could not write config file: " + error);
				callback(error);
			}
			else {
				logger.info("Config file written");
				callback();
			}
		});
	}catch(ex) {
		callback(ex);
	}

};

ClimateController.prototype.getCurrentTargetTemperature = function(date) {
	var now = date?date:new Date();
	var nowInt = "" + now.getHours() + now.getMinutes();

	if(now.getDay() == 0 || now.getDay() == 7) { //weekend
		logger.debug("we are in the weekend");
		var startInt = this._config.heating.weekend_start_time.substr(0,2) + this._config.heating.weekend_start_time.substr(3,2);
		var endInt = this._config.heating.weekend_stop_time.substr(0,2) + this._config.heating.weekend_stop_time.substr(3,2);
		if(nowInt > startInt && nowInt < endInt) {
			logger.debug("we are at home");
			return this._config.heating.temperature_present;
		}
		else {
			logger.debug("we are away")
			return this._config.heating.temperature_away;
		}
	}
	else { //week
		var startMorningInt = this._config.heating.week_start_morning.substr(0,2) + this._config.heating.week_start_morning.substr(3,2);
		var endMorningInt = this._config.heating.week_end_morning.substr(0,2) + this._config.heating.week_end_morning.substr(3,2);

		var startEveningInt = this._config.heating.week_start_evening.substr(0,2) + this._config.heating.week_start_evening.substr(3,2);
		var endEveningInt = this._config.heating.week_end_evening.substr(0,2) + this._config.heating.week_end_evening.substr(3,2);
		logger.debug("we are in the week");
		if( (nowInt > startMorningInt && nowInt < endMorningInt) || (nowInt > startEveningInt && nowInt < endEveningInt)) {
			logger.debug("we are at home");
			return this._config.heating.temperature_present;
		}
		else {
				logger.debug("we are away")
				return this._config.heating.temperature_away;
			}

	}
};

module.exports = ClimateController;





