var noble = require('noble');

var devices = [];

noble.state = 'poweredOn';

noble.startScanning(devices, true);

setInterval(function () {
	console.log("--- Showing devices ---");
	console.log(devices);
}, 1000);
