var Myo = require('myo');
var myMyo = Myo.create(); //default to id 0

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


