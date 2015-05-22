var RollingSpider = require("rolling-spider");
var yourDrone = new RollingSpider();
var temporal = require("temporal");

var Myo = require('myo');
var myMyo = Myo.create(); //default to id 0

yourDrone.connect(function() {
  yourDrone.setup(function() {
    // NEW CODE
    temporal.queue([
      {
        delay: 0,
        task: function () {
          yourDrone.flatTrim();
          yourDrone.startPing();
          yourDrone.takeOff();
        }
      },
      {
        delay: 1000,
        task: function () {
          yourDrone.forward();
        }
      },
      {
        delay: 500,
        task: function () {
          yourDrone.land();
        }
      }]);
  });
});

myMyo.on('connected', function () {
    myMyo.setLockingPolicy('none');
});

myMyo.on('double_tap', function (edge) {
    if(edge){
        if(!myMyo.isLocked)  {
            console.log("Lock");
            myMyo.lock();
        }else {
            console.log("Unlock");
            myMyo.unlock();
        }
    }
});
