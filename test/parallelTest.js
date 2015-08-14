var assert = require('assert');
var asynk = require('../asynk.js');


describe('Parallel', function () {
    it('should return functions\' results in inserted order', function (done) {
        asynk.add(f30ms).args(0, asynk.callback)
                .add(f10ms).args(1, asynk.callback)
                .add(f20ms).args(2, asynk.callback)
                .parallel()
                .done(function (results) {
                    assert(results[0] === 0, 'first result is not first inserted function\'s result');
                    assert(results[1] === 1, 'second result is not second inserted function\'s result');
                    assert(results[2] === 2, 'third result is not third inserted function\'s result');
                    done();
                });
    });

    it('should insert a function per data in array passed to each', function (done) {
        asynk.each([0, 1, 2], f30ms)
                .each([0, 1, 2], f10ms)
                .each([0, 1, 2], f20ms)
                .parallel()
                .done(function (results) {
                    assert(results.length === 9);
                    assert(results[0] === 0);
                    assert(results[3] === 0);
                    assert(results[8] === 2);
                    done();
                });
    });
});
