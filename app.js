var RollingSpider = require("rolling-spider");
var Myo = require('myo');
var keypress = require('keypress');
var temporal = require("temporal");
var lastevent = "";
keypress(process.stdin);

var myMyo = Myo.create(); //default to id 0
var lastevent = "";
var poing = false;
var started = false;
var mov = false;
var canBackflip = true;
var sendVibr = true;
var firstOrientationAngles;
var curr;

function sendMove()
{
	if (sendVibr)
	{
		sendVibr = false;
		myMyo.vibrate('short');
		setTimeout(function(){sendVibr = true;}, 500);
	}
}

myMyo.on('orientation', function(data){
	if (started)
	{
	if (!canBackflip)
		return ;
	getFirstOrientation();
	var orientationAngles ={
		roll : getRoll(myMyo.lastIMU.orientation),
		pitch : getPitch(myMyo.lastIMU.orientation),
		yaw : getYaw(myMyo.lastIMU.orientation)
	};
	
	setTimeout(backflipHandle.bind(undefined, orientationAngles), 300);
	curr = orientationAngles;
	var percent = (orientationAngles.roll - firstOrientationAngles.roll) * (100 / firstOrientationAngles.roll) * 4;
	console.log(percent);
	if (orientationAngles.pitch < 8)
	{
		sendMove();
		console.log("backward");
		if (drone.connected)
			drone.backward((8 - orientationAngles.pitch) * (100 / 7), 0);
	}
	else if (orientationAngles.pitch > 12)
	{	
		sendMove();
		console.log("forward");
		if (drone.connected)
			drone.forward((orientationAngles.pitch - 12) * (100 / 7), 0);
	}
	else if (percent > 15)
	{
		sendMove();
		mov = true;
		var val = Math.min(percent, 100);
		//console.log(val);
		console.log("tilt right");
		if (drone.connected)
			drone.tiltRight(val - 15, 0);
	}
	else if (percent < -15)
	{
		sendMove();
		mov = true;
		var val = Math.min(-percent, 100);
		//console.log(val);
		console.log("tilt left");
		if (drone.connected)
			drone.tiltLeft(val - 15, 0);
	}
	else
	{
		if (mov)
		{
			console.log("retablissement");
			if (drone.connected)
				drone.flatTrim();
			mov = false;
		}
	}
	}
});

function backflipHandle(old){
	if (!canBackflip)
		return ;
	var diff_x = old.yaw - curr.yaw;
	var diff_y = old.pitch - curr.pitch;
	//console.log("x " + diff_x);
	//console.log("y " + diff_y);
	if (diff_x > 5)
	{
		console.log("right");
		if (drone.connected)
			drone.rightFlip();
		setTimeout(function() { canBackflip = true;}, 2000);
		canBackflip = false;	
	}
	if (diff_x < -5)
	{
		console.log("left");
		if (drone.connected)
			drone.leftFlip();
		setTimeout(function() { canBackflip = true;}, 2000);
		canBackflip = false;	
	}
	if (diff_y > 4)
	{
		console.log("up");
		if (drone.connected)
			drone.frontFlip();
		setTimeout(function() { canBackflip = true;}, 2000);
		canBackflip = false;	
	}
	if (diff_y < -5)
	{
		console.log("down");
		if (drone.connected)
			drone.backFlip();
		setTimeout(function() { canBackflip = true;}, 2000);
		canBackflip = false;	
	}
	//console.log(curr);
}

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
	if(edge){
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


myMyo.on('rest', function(edge){
		console.log("retablissement");
		if (drone.connected)
			drone.flatTrim();
});
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

8/*myMyo.on('wave_in', function(edge){
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
		drone.frontFlip();
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
