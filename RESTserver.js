var Interpreter = require('./interpreter.js');
var restify = require('restify');
var winston = require('winston');


var port    =  '8080';
serverInstance = new RestServer();

function RestServer() {
    this.server = restify.createServer({
        name: "DomoticaServer"
    });
    /*initialize the serial port */
    this.interpreter = new Interpreter();

    /*initialize the server */
    this.server.use(restify.queryParser());
    this.server.use(restify.bodyParser());
    this.server.use(restify.CORS({origins: ['*']}));
    this.server.use(restify.fullResponse());

    this.server.listen(port, function () {
        winston.info('%s listening at %s ', this.server.name, this.server.url);
    });

    this.interpreter.setCallback(this.onSerialDataIn);

    /*this.server.opts({path: '/'}, function(oEvent) {
     winston.info(oEvent);
     });*/

    this.server.get({path: '/'}, this.onGetRequest);
    this.server.post({path: 'living/uplighter/on'}, this.onUplighterOn);
    this.server.post({path: 'living/uplighter/off'}, this.onUplighterOff);
    this.server.post({path: 'living/twilight/on'}, this.onTwilightOn);
    this.server.post({path: 'living/twilight/off'}, this.onTwilightOff);
    this.server.get({path: 'living/uplighter'}, this.onUplighterState);
    this.server.get({path: 'living/twilight'}, this.onTwilightState);
}

RestServer.prototype.onTwilightState = function(request, response) {

}

RestServer.prototype.onUplighterState = function (request, response) {

    this.currentResponse = response;
    interpreter.message("0000", "request", "SWST", "2");


}


RestServer.prototype.onSerialDataIn = function (line) {
    console.log(this.toString());
    if(this.currentResponse)
        this.currentResponse.writeHead(200, {
        'Content-Type' : 'application/json'
    });
    winston.info("serial data: " + line);
    if(line.indexOf("0000STATSWST20") != -1) {
        if(this.currentResponse) {
            this.currentResponse.end(
                JSON.stringify("{living: {uplighter: off}}")
            );
            winston.debug("uplighter off");
            this.currentResponse = undefined;
        }
    }
    else if (line.indexOf("0000STATSWST21") != -1) {
        if(this.currentResponse) {
            this.currentResponse.end(
                JSON.stringify("{living: {uplighter: on}}")
            );
            winston.debug("uplighter on");
            this.currentResponse = undefined;
        }
    }
    else
        if(this.currentResponse) {
            this.currentResponse.end("{error: no matching string found");
            this.currentResponse = undefined;
        }


}

RestServer.prototype.onUplighterOn = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({uplighter: "on"}));
    response.end();
    winston.info("Uplighter on command");
    interpreter.message("0000", "command", "SWON", "2");
}

RestServer.prototype.onUplighterOff = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({uplighter: "off"}));
    response.end();
    winston.info("Uplighter off command");
    interpreter.message("0000", "command", "SWOF", "2");
}

RestServer.prototype.onTwilightOn = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({twilight: "on"}));
    response.end();
    winston.info("Uplighter on command");
    interpreter.message("0000", "command", "SWON", "1");
}

RestServer.prototype.onTwilightOff = function(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({twilight: "off"}));
    response.end();
    winston.info("Uplighter off command");
    interpreter.message("0000", "command", "SWOF", "1");
}


RestServer.prototype.onGetRequest = function(request, response) {
    response.writeHead(200, {
        'Content-Type': 'application/json'
    });
    response.end(JSON.stringify(request.headers));
    winston.info("Request method: ", request.method);
    winston.info("Request headers: ", JSON.stringify(request.headers));
    winston.info("Request url: ", request.url);
}

module.exports = RestServer;