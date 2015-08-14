var assert = require('assert');
var asynk = require('../asynk.js');


describe('Series', function () {
    it('should return functions\' results in inserted order', function (done) {
        asynk.add(function(callback){ callback(null,0); })
                .add(function(callback){ callback(null,1); })
                .add(function(callback){ callback(null,2); })
                .serie().done(function (results) {
                    assert(results[0] === 0, 'first result is not first inserted function\'s result');
                    assert(results[1] === 1, 'second result is not second inserted function\'s result');
                    assert(results[2] === 2, 'third result is not third inserted function\'s result');
                    done();
                });
    });
    it('asynk.data should inject result of function number order at the input of other', function (done) {
        asynk.add(f30ms).args(0, asynk.callback)
                .add(f10ms).args(asynk.data(0), asynk.callback)
                .add(f30ms).args(1, asynk.callback)
                .add(f20ms).args(asynk.data(2), asynk.callback)
                .add(f20ms).args(asynk.data(-3), asynk.callback)
                .serie().done(function (results) {
                    assert(results[1] === results[0]);
                    assert(results[3] === results[2]);
                    assert(results[4] === results[1]);
                    done();
                });
    });
    it('asynk.data should inject result of alias function at the input of other', function (done) {
        asynk.add(f30ms).args(0, asynk.callback).alias('one')
                .add(f10ms).args(asynk.data('one'), asynk.callback).alias('two')
                .add(f30ms).args(1, asynk.callback).alias('tree')
                .add(f20ms).args(asynk.data('tree'), asynk.callback)
                .add(f20ms).args(asynk.data('two'), asynk.callback)
                .serie().done(function (results) {
                    assert(results[1] === results[0]);
                    assert(results[3] === results[2]);
                    assert(results[4] === results[1]);
                    done();
                });
    });
});