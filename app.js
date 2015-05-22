var RollingSpider = require("rolling-spider");
var Myo = require('myo');
var keypress = require('keypress');
var temporal = require("temporal");

keypress(process.stdin);

var myMyo = Myo.create(); //default to id 0
// Implement your own locking. Example: (Handle locking yourself like described above!!!!)

var poing = false;

myMyo.on('gyroscope', function(data){
	if (poing){
		if(data.x > 8){
			console.log("Move right !!");
			drone.right();
		}
		else if(data.y > 10){
			console.log("Move left !!");
			drone.left();
		}
	}
});

myMyo.on('double_tap', function (edge) {
	if(edge){
		console.log("Connect");
	}
});

myMyo.on('fist', function(edge) {
	//edge is true if it's the start of the pose, false if it's the end of the pose
	if(edge){
		console.log("poing fermer");
	}
	poing = true;
});

//Fires a spread_hold event if spread is held for half a second
myMyo.on('fingers_spread', function(edge){
	if(edge){
		console.log("poing ouvert");
	}
});

myMyo.on('wave_in', function(edge){
	if(edge){
		console.log("main a gauche");
	}
});

myMyo.on('wave_out', function(edge){
	if(edge){
		console.log("Main a droite");
	}
});

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
	}
});

process.stdin.resume();

var drone = new RollingSpider();

drone.connect(function(){
	drone.setup();
});
