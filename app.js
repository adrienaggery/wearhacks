var RollingSpider = require("rolling-spider");
var Myo = require('myo');
var keypress = require('keypress');
var temporal = require("temporal");
var lastevent = "";
keypress(process.stdin);

var myMyo = Myo.create(); //default to id 0
// Implement your own locking. Example: (Handle locking yourself like described above!!!!)
var lastevent = "";
var poing = false;
var started = false;
var mov = false;

var firstOrientationAngles;

myMyo.on('orientation', function(data){
	if (started)
	{
	getFirstOrientation();
	var orientationAngles ={
		roll : getRoll(myMyo.lastIMU.orientation),
		pitch : getPitch(myMyo.lastIMU.orientation),
		yaw : getYaw(myMyo.lastIMU.orientation)
	};
	console.log();	
	var percent = (orientationAngles.roll - firstOrientationAngles.roll) * (100 / firstOrientationAngles.roll) * 4;
	if (orientationAngles.pitch < 7)
	{	
		if (drone.connected)
			drone.backward((7 - orientationAngles.pitch) * (100 / 7), 0);		
	}
	else if (orientationAngles.pitch > 11)
	{	
		if (drone.connected)
			drone.forward((orientationAngles.pitch - 11) * (100 / 7), 0);		
	}
	if (percent > 35)
	{
		mov = true;
		var val = Math.min(percent, 100);
		console.log(val);
		if (drone.connected)
			drone.tiltRight(val- 35, 0);		
	}
	else if (percent < -35)
	{
		mov = true;
		var val = Math.min(-percent, 100);
		console.log(val);
		if (drone.connected)
			drone.tiltLeft(val - 35, 0);		
	}
	else
	{
		if (mov)
		{
			if (drone.connected)
				drone.flatTrim();
			mov = false;
		}
	}
	}
});

function getFirstOrientation(){
	firstOrientationAngles ={
		roll : getRoll(myMyo.lastIMU.orientation),
		pitch : getPitch(myMyo.lastIMU.orientation),
		yaw : getYaw(myMyo.lastIMU.orientation)
	};
	for (var i = 0; i < 10000; i++) {
		firstOrientationAngles.roll  += getRoll(myMyo.lastIMU.orientation);
		firstOrientationAngles.pitch += getPitch(myMyo.lastIMU.orientation);
		firstOrientationAngles.yaw   += getYaw(myMyo.lastIMU.orientation); 
	};

	firstOrientationAngles.roll /= 10000;
	firstOrientationAngles.pitch /= 10000;
	firstOrientationAngles.yaw /= 10000;

	getFirstOrientation = noop;
}

function noop(){}

function getRoll(data){
	var roll = Math.atan2(2.0 * (data.w * data.x + data.y * data.z), 1.0 - 2.0 * (data.x * data.x + data.y * data.y));
	var roll_w = ((roll + Math.PI)/(Math.PI * 2.0) * 18);
	return roll_w;
}

function getPitch(data){
	var pitch = Math.asin(Math.max(-1.0, Math.min(1.0, 2.0 * (data.w * data.y - data.z * data.x))));
	var pitch_w = ((pitch + Math.PI/2.0)/Math.PI * 18);
	return pitch_w;
}

function getYaw(data){
	var yaw = Math.atan2(2.0 * (data.w * data.z + data.x * data.y), 1.0 - 2.0 * (data.y * data.y + data.z * data.z));
	var yaw_w = ((yaw + Math.PI/2.0)/Math.PI * 18);
	return yaw_w;
}

/*myMyo.on('imu', function(data){
	//if (poing){
		console.log(data);
		if(data.gyroscope.x > 15){
			if (lastevent != "right")
			{
				lastevent = "right";
				console.log("Move right !!");
				if (drone)
					drone.tiltRight();
			}
		}
		else if(data.gyroscope.y > 50){
			if (lastevent != "left")
			{
				console.log("Move left !!");
				lastevent = "left";
				if (drone)
					drone.tiltLeft();
			}
		}
		else
		{
			if (drone)
				drone.flatTrim();
		}
	//}
});*/

myMyo.on('double_tap', function (edge) {
	if(edge){
		if (!started)
		{
			if (drone.connected)
			{
				drone.flatTrim();
				drone.startPing();
				drone.takeOff();
			}
			console.log("Decollage");
		}
		else
		{
			if (drone.connected)
				drone.land();
			console.log("Aterrisage");
		}
		started = !started;
	}
});

myMyo.on('fist', function(edge) {
	//edge is true if it's the start of the pose, false if it's the end of the pose
	if(edge){
		console.log(drone);
		if (drone.connected)
		{
			if (drone.status.flying)
				drone.up();
			else
			{
				drone.flatTrim();
				drone.startPing();
				drone.takeOff();
			}
		}
		console.log("poing fermer");
	}
	poing = true;
});

//Fires a spread_hold event if spread is held for half a second
myMyo.on('fingers_spread', function(edge){
	if(edge){
		if (drone.connected)
			drone.down();
		console.log("poing ouvert");
	}
});

/*myMyo.on('unlock', function(){
   drone.emergency();
    myMyo.vibrate();
});*/

/*8myMyo.on('wave_in', function(edge){
	if(edge){
		console.log("main a gauche");
	}
});

myMyo.on('wave_out', function(edge){
	if(edge){
		console.log("Main a droite");
	}
});*/

process.stdin.on('keypress', function(ch, key){
	switch (key.name) {
	case 'i':
		drone.flatTrim();
		drone.startPing();
	break;
	case 't':
		drone.takeOff();
	break;
	case 'l':
		drone.land();
	break;
	case 'f':
		drone.forward();
	break;
	case 'z':
		drone.leftFlip();
	break;
	case 'q':
		drone.emergency();
	break;
	case 'r':
		drone.tiltRight();
	break;
	case 'e':
		drone.tiltLeft();
	break;
	case 'u':
		drone.up();
	break;
	}
});

process.stdin.resume();

var drone = new RollingSpider();

drone.connect(function(){
	drone.setup();
});
