var assert = require('assert');
var asynk = require('../asynk.js');


describe('ParallelLimited', function () {
    it('should return functions\' results in inserted order', function (done) {
        asynk.add(f30ms).args(0, asynk.callback)
                .add(f10ms).args(1, asynk.callback)
                .add(f20ms).args(2, asynk.callback)
                .add(f30ms).args(3, asynk.callback)
                .add(f10ms).args(4, asynk.callback)
                .add(f20ms).args(5, asynk.callback)
                .add(f30ms).args(6, asynk.callback)
                .add(f10ms).args(7, asynk.callback)
                .add(f20ms).args(8, asynk.callback)
                .add(f30ms).args(9, asynk.callback)
                .add(f10ms).args(10, asynk.callback)
                .add(f20ms).args(11, asynk.callback)
                .add(f30ms).args(12, asynk.callback)
                .add(f10ms).args(13, asynk.callback)
                .add(f20ms).args(14, asynk.callback)
                .add(f30ms).args(15, asynk.callback)
                .add(f10ms).args(16, asynk.callback)
                .add(f20ms).args(17, asynk.callback)
                .add(f30ms).args(18, asynk.callback)
                .add(f10ms).args(19, asynk.callback)
                .add(f20ms).args(20, asynk.callback)
                .add(f30ms).args(21, asynk.callback)
                .add(f10ms).args(22, asynk.callback)
                .add(f20ms).args(23, asynk.callback)
                .add(f30ms).args(24, asynk.callback)
                .parallelLimited(3)
                .done(function(results){
                    assert(results[0] === 0);
                    assert(results[5] === 5);
                    assert(results[12] === 12);
                    assert(results[17] === 17);
                    assert(results[20] === 20);
                    assert(results[23] === 23);
                    done();
                });
    });
});
