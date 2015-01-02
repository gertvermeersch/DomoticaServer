var http = require('http'),  
    winston = require('winston');

/**
 * Creates the server for the pinpoint web service
 * @param {int} port: Port for the server to run on
 */
createServer = function (port) {  
  var server = http.createServer(function (request, response) {
    var data = '';



    request.on('data', function (chunk) {
      data += chunk;
    });

    if(request.method == "OPTIONS") {
      response.writeHead(200, {'Access-Control-Allow-Origin': "*",
                                'Access-Control-Allow-Headers': "Origin, X-Requested-With, Content-Type, Accept" });
      response.end();

    }else {
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': "*"
      });
      response.end(JSON.stringify(request.headers));
      winston.info("Request method: ", request.method);
      winston.info("Request headers: ", JSON.stringify(request.headers));
      winston.info("Request url: ", request.url);
    }
  });


  if (port) {
    server.listen(port);
  }

  return server;
};

createServer(8080);
