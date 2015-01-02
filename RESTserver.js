var Interpreter = require('./interpreter.js');
var restify = require('restify');
var winston = require('winston');


var port    =  '8080';

var server = restify.createServer({
    name : "myapp"
});
/*initialize the serial port */
interpreter = new Interpreter();

/*initialize the server */
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS({origins: ['*']}));
server.use(restify.fullResponse());

server.listen(port , function(){
    winston.info('%s listening at %s ', server.name , server.url);
});

/*server.opts({path: '/'}, function(oEvent) {
    winston.info(oEvent);
});*/

server.get({path: '/'}, onGetRequest);
server.post({path: 'living/uplighter/on'}, onUplighterOn);
server.post({path: 'living/uplighter/off'}, onUplighterOff);
server.post({path: 'living/twilight/on'}, onTwilightOn);
server.post({path: 'living/twilight/off'}, onTwilightOff);
/*server.get({path: 'living/twilight/on'}, onUplighterOn);
server.get({path: 'living/twilight/off'}, onUplighterOff);
server.get({path: 'living/twilights/on'}, onUplighterOn);
server.get({path: 'living/twilights/off'}, onUplighterOff);
server.get({path: 'bedroom/saltlamp/on'}, onUplighterOn);
server.get({path: 'bedroom/saltlamp/off'}, onUplighterOff);
server.get({path: 'bedroom/twilight/on'}, onUplighterOn);
server.get({path: 'bedroom/twilight/off'}, onUplighterOff);*/

function onUplighterOn(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({uplighter: "on"}));
    response.end();
    winston.info("Uplighter on command");
    interpreter.message("0000", "command", "SWON", "2");
}

function onUplighterOff(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({uplighter: "off"}));
    response.end();
    winston.info("Uplighter off command");
    interpreter.message("0000", "command", "SWOF", "2");
}

function onTwilightOn(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({twilight: "on"}));
    response.end();
    winston.info("Uplighter on command");
    interpreter.message("0000", "command", "SWON", "1");
}

function onTwilightOff(request, response) {
    response.writeHead(200, {
        'Content-Type' : 'application/json'
    })
    response.write(JSON.stringify({twilight: "off"}));
    response.end();
    winston.info("Uplighter off command");
    interpreter.message("0000", "command", "SWOF", "1");
}


 function onGetRequest(request, response) {
    response.writeHead(200, {
        'Content-Type': 'application/json'
    });
    response.end(JSON.stringify(request.headers));
    winston.info("Request method: ", request.method);
    winston.info("Request headers: ", JSON.stringify(request.headers));
    winston.info("Request url: ", request.url);
}