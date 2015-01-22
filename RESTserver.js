var Interpreter = require('./interpreter.js');
var restify = require('restify');
var winston = require('winston');
var fs = require('fs');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});
winston.add(winston.transports.File, {filename: "/home/gert/domotica/server.log"});

function RestServer(port) {
    this.states = {
        living: {
            uplighter: "",
            twilight: "",
            twilights: "",
            desklight: "",
            temperature: ""
        },
        bedroom: {
            saltlamp: "",
            scent: ""
        }
    };
    this.currentResponses = [];
    var self = this;

    this.server = restify.createServer({
        key: fs.readFileSync('/etc/nginx/ssl/ssl.key'),
        certificate: fs.readFileSync('/etc/nginx/ssl/ssl-unified.crt'),
        name: "DomoticaServer"
    });
    /*initialize the serial port */
    this.interpreter = new Interpreter();
    this.interpreter.serialPort.on('open', function(error) {self.onSerialReady(error)});
    /*initialize the server */
    this.interpreter.setStates(self.states);

    this.server.use(restify.queryParser());
    this.server.use(restify.bodyParser());

    this.server.use(restify.authorizationParser());
    this.server.use(restify.CORS({origins: ['*'], credentials: true}));
    this.server.use(restify.fullResponse());
    restify.CORS.ALLOW_HEADERS.push('authorization'); //allow authorization



    this.server.use(function authenticate(req, res, next) {
        //console.log(req.authorization.basic);
        if(req.authorization.basic == undefined) {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Backend authorization required!"');
            res.end('No credentials found');
        }
        else if(req.authorization.basic.username == "domoticaApp" && req.authorization.basic.password == "D0m0t1c4") {
            return next();
        }
        else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Backend authorization required!"');
            res.end('Wrong credentials found');
            winston.info("Authentication failed");
        }

    });



    //set timeout
    this.server.use(function (req, res, next) {
        // This will set the idle timer to 10 minutes
        req.connection.setTimeout(5000);
        res.connection.setTimeout(5000); //**Edited**
        next();
    });

    this.server.listen(port, function () {
        winston.info('%s listening at %s ',self.server.name, self.server.url);

    });

    this.interpreter.setCallback(function() {
        self.onSerialDataIn();
    });

    //Register callbacks

    //this.server.get({path: '[\/a-z0-9]+'}, function(req, res) {
    this.server.get({path: 'living/uplighter'}, function(req, res) {
        self.onGetRequest(req, res);
    });
    this.server.get({path: 'living/twilight'}, function(req, res) {
        self.onGetRequest(req, res);
    });
    this.server.get({path: 'living/twilights'}, function(req, res) {
        self.onGetRequest(req, res);
    });
    this.server.get({path: 'living/desklight'}, function(req, res) {
        self.onGetRequest(req, res);
    });
    this.server.get({path: '/'}, function(req, res) {
        self.onGetRequest(req, res);
    });
    this.server.post({path: 'living/uplighter/on'},function(req, res, next) {
        self.onUplighterOn(req, res, next);
    });
    this.server.post({path: 'living/uplighter/off'}, function(req, res, next) {
        self.onUplighterOff(req, res, next);
    });
    this.server.post({path: 'living/desklight/on'},function(req, res, next) {
        self.onDesklightOn(req, res, next);
    });
    this.server.post({path: 'living/desklight/off'}, function(req, res, next) {
        self.onDesklightOff(req, res, next);
    });
    this.server.post({path: 'living/twilight/on'}, function(req, res, next) {
        self.onTwilightOn(req, res, next);
    });
    this.server.post({path: 'living/twilight/off'}, function(req, res, next) {
        self.onTwilightOff(req, res, next);
    });
    this.server.post({path: 'living/twilights/on'}, function(req, res, next) {
        self.onTwilightsOn(req, res, next);
    });
    this.server.post({path: 'living/twilights/off'}, function(req, res, next) {
        self.onTwilightsOff(req, res, next);
    });
    this.server.post({path: 'bedroom/saltlamp/on'}, function(req, res, next) {
        self.onSaltlampOn(req, res, next);
    });
    this.server.post({path: 'bedroom/saltlamp/off'}, function(req, res, next) {
        self.onSaltlampOff(req, res, next);
    });
    this.server.post({path: 'bedroom/scent/on'}, function(req, res, next) {
        self.onScentOn(req, res, next);
    });
    this.server.post({path: 'bedroom/scent/off'}, function(req, res, next) {
        self.onScentOff(req, res, next);
    });




}


RestServer.prototype.onSerialReady = function(error) {
    var self = this;
    if ( error ) {
        winston.error('failed to open: '+error);
    } else {
        winston.info('opened serial connection to micro controller');
        //refresh states
        self.interpreter.message("0000", "request", "SWST", "0", self.states);
        setTimeout(function() {
            self.interpreter.message("0000", "request", "SWST", "1", self.states);
            setTimeout(function() {
                self.interpreter.message("0000", "request", "SWST", "2", self.states);
                setTimeout(function() {
                    self.interpreter.message("0000", "request", "SWST", "3", self.states);
                    setTimeout(function() {
                        self.interpreter.message("0000", "request", "SWST", "4", self.states);
                        setTimeout(function() {
                            self.interpreter.message("0000", "request", "SWST", "5", self.states);
                            console.log(self.states);
                            setInterval(function() {
                                self.interpreter.message("wwww", "request", "TEMP", "", self.states);
                            }, 5000);
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
        }, 100);


    }
}

RestServer.prototype.onSerialDataIn = function () {
    winston.log("update received: " + this.states);
}

RestServer.prototype.onScentOn = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({scent: "on"}));
    response.end();
    winston.info("Scent on command");
    this.interpreter.message("0000", "command", "SWON", "5");
    this.states.bedroom.scent = "on";
}

RestServer.prototype.onScentOff = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({scent: "off"}));
    response.end();
    winston.info("Scent off command");
    this.interpreter.message("0000", "command", "SWOF", "5");
    this.states.bedroom.scent = "off"
}

RestServer.prototype.onDesklightOn = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({desklight: "on"}));
    response.end();
    winston.info("Desklight on command");
    this.interpreter.message("0000", "command", "SWON", "0");
    this.states.living.desklight = "on";
}

RestServer.prototype.onDesklightOff = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({desklight: "off"}));
    response.end();
    winston.info("Desklight off command");
    this.interpreter.message("0000", "command", "SWOF", "0");
    this.states.living.desklight = "off"
}

RestServer.prototype.onSaltlampOn = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({saltlamp: "on"}));
    response.end();
    winston.info("Saltlamp on command");
    this.interpreter.message("0000", "command", "SWON", "4");
    this.states.living.saltlamp = "on";
}

RestServer.prototype.onSaltlampOff = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({saltlamp: "off"}));
    response.end();
    winston.info("Saltlamp off command");
    this.interpreter.message("0000", "command", "SWOF", "4");
    this.states.bedroom.saltlamp = "off"
}

RestServer.prototype.onUplighterOn = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    });
    response.write(JSON.stringify({uplighter: "on"}));
    response.end();
    winston.info("Uplighter on command");
    this.interpreter.message("0000", "command", "SWON", "2");
    this.states.living.uplighter = "on";
}

RestServer.prototype.onUplighterOff = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({uplighter: "off"}));
    response.end();
    winston.info("Uplighter off command");
    this.interpreter.message("0000", "command", "SWOF", "2");
    this.states.living.uplighter = "off";
}

RestServer.prototype.onTwilightOn = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({twilight: "on"}));
    response.end();
    winston.info("Twilight on command");
    this.interpreter.message("0000", "command", "SWON", "1");
    this.states.living.twilight = "on";
}

RestServer.prototype.onTwilightOff = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({twilight: "off"}));
    response.end();
    winston.info("Twilight off command");
    this.interpreter.message("0000", "command", "SWOF", "1");
    this.states.living.twilight = "off";
}

RestServer.prototype.onTwilightsOn = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({Twilights: "on"}));
    response.end();
    winston.info("Twilights on command");
    this.interpreter.message("0000", "command", "SWON", "3");
    this.states.living.twilights = "on";
}

RestServer.prototype.onTwilightsOff = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({Twilights: "off"}));
    response.end();
    winston.info("Twilights off command");
    this.interpreter.message("0000", "command", "SWOF", "3");
    this.states.living.twilights = "off";
}


RestServer.prototype.onGetRequest = function(request, response) {
    var self = this;
    response.statusCode = 200;
    response.on('close', (function() {
        winston.error("Response was closed before end was sent");
        for(i = 0; i < self.currentResponses.length; i++) {
            if(self.currentResponses[i] === this) {
                self.currentResponses.splice(i, 1);
                winston.error("Response removed from the stack");
            }
        }

    }));

    response.on('finish',(function() {
        winston.info("Response was normally ended");
    }));

    winston.info("Request received from " + request.socket.remoteAddress + " with accept: " + request.headers.accept);
    if(request.headers.accept.indexOf("application/json") != -1 || request.headers.accept.indexOf("*/*") != -1) {
        response.end(JSON.stringify(this.states));
    }
    else
        response.end("Client does not accept JSON");
}

module.exports = RestServer;