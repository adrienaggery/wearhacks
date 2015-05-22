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
		console.log("RS drone found.");
		noble.stopScanning();
		RS_connect(device);
	}
});

function RS_connect(drone)
{
	drone.on('disconnect', function(){
		console.log("Lost connection to RS drone.");
		process.exit(0);
	});
	drone.connect(function(error)
	{
		if (error){
			console.log("Error while connecting to the drone: " + error);
			process.exit(0);
		}
		else {
			console.log("Connected to RS drone.");
		}
	});
}
