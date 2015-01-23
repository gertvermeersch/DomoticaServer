var Interpreter = require('./interpreter.js');
var restify = require('restify');
var winston = require('winston');
var fs = require('fs');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});
winston.add(winston.transports.File, {filename: "/home/gert/domotica/server.log"});

function RestServer(port) {

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

    this.server.get({path: '/'}, function(req, res) {
        self.onGetRequest(req, res);
    });

    this.server.post({path: '[\/a-z0-9]+'}, function(req, res, next) {
        self.onPost(req, res, next);
    })

}

RestServer.prototype.setStates = function(states) {
    this._states = states;
    this.interpreter.setStates(this._states);
}

RestServer.prototype.setConfig = function(config) {
    this._config = config;
    console.log(this._config);
}

RestServer.prototype.onPost = function(req, res, next) {
    var found = false;
    for (var i in this._config) {
        var item = this._config[i];
        if (item.path == req.url) {
            this.interpreter.message(item.message.address, item.message.type, item.message.parameter, item.message.value);
            //set state
            this._states[item.room][item.device] = item.state;
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            found = true;
            res.end(JSON.stringify({result: "success"}));
        }
    }
    if (!found) {
        res.writeHead(500, {
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({error: "Could not find a config entry for this request"}));
    }
}


RestServer.prototype.onSerialReady = function(error) {
    var self = this;
    if ( error ) {
        winston.error('failed to open: ' + error);
    } else {

        winston.info('opened serial connection to micro controller');
        //refresh _states
        self.interpreter.message("wwww", "request", "TEMP", "", self._states);
        setTimeout(function() {
            self.interpreter.message("0000", "request", "SWST", "0", self._states);
            setTimeout(function () {
                self.interpreter.message("0000", "request", "SWST", "1", self._states);
                setTimeout(function () {
                    self.interpreter.message("0000", "request", "SWST", "2", self._states);
                    setTimeout(function () {
                        self.interpreter.message("0000", "request", "SWST", "3", self._states);
                        setTimeout(function () {
                            self.interpreter.message("0000", "request", "SWST", "4", self._states);
                            setTimeout(function () {
                                self.interpreter.message("0000", "request", "SWST", "5", self._states);
                                console.log(self._states);
                                setInterval(function () {
                                    self.interpreter.message("wwww", "request", "TEMP", "", self._states);
                                }, 60000);
                            }, 100);
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
        }, 100);


    }
}

RestServer.prototype.onSerialDataIn = function () {
    //console.log("restserver states:");
    //console.log(this._states);
    winston.log("update received: " + this._states);
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
        response.end(JSON.stringify(this._states));
    }
    else
        response.end("Client does not accept JSON");
}

module.exports = RestServer;