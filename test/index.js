var mocha = require('mocha'),
        fs = require('fs'),
        path = require('path');


// Build a Mocha Runner
var test = new mocha({
    bail: true,
    timeout: 2000
});

fs.readdirSync(__dirname).filter(function (file) {
    return file.substr(-7) === 'Test.js';

}).forEach(function (file) {
    test.addFile(
            path.join(__dirname, file)
            );
});

var runner = test.run(function (err) {
    if (err) {
        process.exit(1);
    } else {
        process.exit(0);
    }
});

runner.on('fail', function (e) {
    console.error(e.err);
});

console.log('Testing asynk\n');

global.f10ms = function f100ms(arg, cb) {
    setTimeout(function () {
        cb(false, arg);
    }, 10);
};

global.f20ms = function f200ms(arg, cb) {
    setTimeout(function () {
        cb(false, arg);
    }, 20);
};

global.f30ms = function f300ms(arg, cb) {
    setTimeout(function () {
        cb(false, arg);
    }, 30);
};