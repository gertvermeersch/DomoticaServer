var winston = require('winston');
var fs = require('fs');

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({timestamp:true}),
      new (winston.transports.File)({ filename: '/home/gert/domotica/climate_control.log' })
    ]
  });


function ClimateController() {
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
					});
				}
			})
		}else {
			logger.info("Config file read: " + JSON.stringify(config));
			self._config = config;
		}
	})
	
};

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
	
};

ClimateController.prototype.getCurrentTargetTemperature = function(callback) {
	
};

module.exports = ClimateController;





