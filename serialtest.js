var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyAMA0", {
  baudrate: 115200
}, false); // this is the openImmediately flag [default is true]
var buf = new Buffer(32);
buf.write("0000REQTSWST1\r");

serialPort.open(function (error) {
  if ( error ) {
    console.log('failed to open: '+error);
  } else {
    console.log('open');
    serialPort.on('data', function(data) {
      console.log(data.toString());
    });
	console.log("contents of serialBuffer: " + buf.toString());
	serialPort.write(buf);
  }
});
