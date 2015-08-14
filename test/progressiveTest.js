var assert = require('assert');
var asynk = require('../asynk.js');

describe('Progressive', function () {
    it('should execute functions in ordered by first argument pushed', function (done) {
        var progr = asynk.progressive();
        var result = '';
        progr.push(6, function (err, data) {
            result += data;
        })(null, 6);
        progr.push(2, function (err, data) {
            result += data;
        })(null, 2);
        progr.push(4, function (err, data) {
            result += data;
        })(null, 4);
        progr.push(1, function (err, data) {
            result += data;
        })(null, 1);
        progr.push(3, function (err, data) {
            result += data;
        })(null, 3);
        progr.push(5, function (err, data) {
            result += data;
        })(null, 5);
        assert(result === '123456');
        done();
    });
});
