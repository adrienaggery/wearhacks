var noble = require('noble');

var RS_uuid = '078b9f9b666a482d87472ba38d7e5e26';

noble.on('stateChange', function(state) {
	if (state === 'poweredOn') {
		noble.startScanning();
		console.log("Started scanning");
	} else {
		noble.stopScanning();
		console.log("Stopped scanning");
	}
});

noble.on('discover', function(device){
	if (device.uuid == RS_uuid)
	{
		device.updateRssi();
		console.log("RS drone found, signal strenght.");
		noble.stopScanning();
		RS_connect(device);
	}
});
