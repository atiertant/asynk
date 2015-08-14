var assert = require('assert');
var asynk = require('../asynk.js');

describe('Fifo', function () {
    it('should execute functions in order then where pushed', function (done) {
        var fifo = asynk.fifo();
        var result = '';
        var f1 = fifo.push(function (err, data) {
            result += data;
        });
        var f2 = fifo.push(function (err, data) {
            result += data;
        });
        var f3 = fifo.push(function (err, data) {
            result += data;
        });
        var f4 = fifo.push(function (err, data) {
            result += data;
        });
        var f5 = fifo.push(function (err, data) {
            result += data;
        });
        var f6 = fifo.push(function (err, data) {
            result += data;
        });
        f6(null, 6);
        f2(null, 2);
        f4(null, 4);
        f1(null, 1);
        f3(null, 3);
        f5(null, 5);
        assert(result === '123456');
        done();
    });
});