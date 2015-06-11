var RollingSpider = require("rolling-spider");
var Myo = require('myo');
var keypress = require('keypress');
var temporal = require("temporal");
var lastevent = "";
keypress(process.stdin);

var myMyo = Myo.create(); //default to id 0
var lastevent = "";
var main = 0;
var started = false;
var mov = false;
var canBackflip = true;
var sendVibr = true;
var firstOrientationAngles;
var curr;
var move = -1;

function sendMove()
{
	if (sendVibr)
	{
		sendVibr = false;
		myMyo.vibrate('short');
		setTimeout(function(){sendVibr = true;}, 550);
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
	if (orientationAngles.pitch < 8)
	{
		if (move == 0)
		{
			sendMove();
			mov = true;
			console.log("backward " + (8 - orientationAngles.pitch) * (100 / 7));
			if (drone.connected)
				drone.backward({speed: (8 - orientationAngles.pitch) * (100 / 7), steps: 10});
		}
		setTimeout(function(){move = 0;}, 200);
	}
	else if (orientationAngles.pitch > 12)
	{	
		if (move == 1)
		{
			sendMove();
			mov = true;
			console.log("forward " + (orientationAngles.pitch - 12) * (100 / 7));
			if (drone.connected)
				drone.forward({speed: (orientationAngles.pitch - 12) * (100 / 7), steps: 10});
		}
		setTimeout(function(){move = 1;}, 200);
	}
	else if (percent > 20)
	{
		if (move == 2)
		{
			sendMove();
			mov = true;
			var val = Math.min(percent, 100);
			//console.log(val);
			console.log("tilt right " + (val - 20));
			if (drone.connected)
				drone.tiltRight({speed: (val - 20)*2, steps: 10});
		}
		setTimeout(function(){move = 2;}, 200);
	}
	else if (percent < -25)
	{
		if (move == 3)
		{
			sendMove();
			mov = true;
			var val = Math.min(-percent, 100);
			//console.log(val);
			console.log("tilt left " + (val - 25));
			if (drone.connected)
				drone.tiltLeft({speed: val - 25, steps: 10});
		}
		setTimeout(function(){move = 3;}, 200);
	}
	else
	{
		move = -1;
		if (mov)
		{
			console.log("retablissement");
			if (drone.connected)
				drone.hover();
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
	if (diff_x > 3.5)
	{
		console.log("right");
		if (drone.connected)
			drone.rightFlip();
		setTimeout(function() { canBackflip = true;}, 2000);
		canBackflip = false;	
	}
	if (diff_x < -3.5)
	{
		console.log("left");
		if (drone.connected)
			drone.leftFlip();
		setTimeout(function() { canBackflip = true;}, 2000);
		canBackflip = false;	
	}
	if (diff_y > 6)
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
				goUp();
		}
		console.log("poing fermer");
		main = 1;
	}
});

function goUp()
{
	if (main != 1)
		return ;
	drone.up({speed: 60, steps: 35});
	setTimeout(goUp, 50);
}

function goDown()
{
	if (main != -1)
		return ;
	drone.down({speed: 70, steps: 10});
	setTimeout(goUp, 50);
}

myMyo.on('rest', function(edge){
		console.log("retablissement");
		main = 0;
		if (drone.connected)
			drone.hover();
});
myMyo.on('fingers_spread', function(edge){
	if(edge){
			if (drone.connected)
				goDown();
		console.log("poing ouvert");
		main = -1;
	}
});

/*function osef(w, yo)
{
	if (yo > 20)
	{
		console.log("OMG");
		if (drone.connected)
		{
			if (wave == 1)
				drone.clockwise({speed: 50, steps: 10});
			if (wave == -1)
				drone.counterClockwise({speed: 50, steps: 10});
		}
		osef(wave, 0);
		return ;
	}
	if (wave == w && (lastevent != "turnleft" || lastevent != "turnright"))
	{
		setTimeout(function(){osef(w, yo+1);}, 100);
	}
}

myMyo.on('wave_in', function(edge){
	if(edge){
		wave = 1;
		osef(wave, 0);
	}
});

myMyo.on('wave_out', function(edge){
	if(edge){
		wave = -1;
		osef(wave, 0);
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
