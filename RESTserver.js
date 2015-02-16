var Interpreter = require('./util/interpreter.js');
var restify = require('restify');
var logger = require('winston');
var fs = require('fs');


var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({timestamp:true}),
      new (winston.transports.File)({ filename: '/home/gert/domotica/server.log' })
    ]
  });

function RestServer(port, interpreter, climateController, config, states) {
	this._config = config;
	this._climateController = climateController;
	this._states = states;
	this._interpreter = interpreter;
    this.currentResponses = [];
    var self = this;

    this.server = restify.createServer({
        key: fs.readFileSync('/etc/nginx/ssl/ssl.key'),
        certificate: fs.readFileSync('/etc/nginx/ssl/ssl-unified.crt'),
        name: "DomoticaServer"
    });
    
    

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
            logger.info("Authentication failed");
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
        logger.info('%s listening at %s ',self.server.name, self.server.url);

    });

    this._interpreter.addCallback(function() {
        self.onSerialDataIn();
    });

    //Register callbacks

    //this.server.get({path: '[\/a-z0-9]+'}, function(req, res) {

    this.server.get({path: '/states'}, function(req, res) {
        self.onGetRequest(req, res);
    });
    
    this.server.get({path: '/heating'}, function(req, res) {
    	res.end(JSON.stringify(self._climateController.getConfig()));
    })

    this.server.post({path: '[\/a-z0-9]+'}, function(req, res, next) {
        self.onPost(req, res, next);
    })

}

RestServer.prototype.setStates = function(states) {
    this._states = states;
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
            this._interpreter.message(item.message.address, item.message.type, item.message.parameter, item.message.value);
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




RestServer.prototype.onSerialDataIn = function () {
    logger.info("State update received: " + JSON.stringify(this._states));
}


RestServer.prototype.onGetRequest = function(request, response) {
    var self = this;
    response.statusCode = 200;
    response.on('close', (function() {
        logger.error("Response was closed before end was sent");
        for(i = 0; i < self.currentResponses.length; i++) {
            if(self.currentResponses[i] === this) {
                self.currentResponses.splice(i, 1);
                logger.error("Response removed from the stack");
            }
        }

    }));

    response.on('finish',(function() {
        logger.info("Response was normally ended");
    }));

    logger.info("Request received from " + request.socket.remoteAddress + " with accept: " + request.headers.accept);
    if(request.headers.accept.indexOf("application/json") != -1 || request.headers.accept.indexOf("*/*") != -1) {
        response.end(JSON.stringify(this._states));
    }
    else
        response.end("Client does not accept JSON");
}

module.exports = RestServer;