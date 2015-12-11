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
    it('should resolve disordered dependencies in parallelLimited', function (done) {
        asynk.each([0, 1, 2], f30ms).require('two')
                .each([0, 1, 2], f10ms).alias('two')
                .each([0, 1, 2], f20ms)
                .parallelLimited(2)
                .done(function (results) {
                    assert(results.length === 9);
                    assert(results[0] === 0);
                    assert(results[3] === 0);
                    assert(results[8] === 2);                    
                    done();
                });
    });
    
    it('should loop each time argument function return true', function (done) {
        var i = 1;
        asynk.each([0, 1, 2], f30ms)
                .each([0, 1, 2], f10ms)
                .each([0, 1, 2], f20ms)
                .parallelLimited(2)
                .loop(function(results){
                    assert(results.length === 9);
                    assert(results[0] === 0);
                    assert(results[3] === 0);
                    assert(results[8] === 2); 
                    return i++ < 3; 
                })
                .done(function (results) {
                    assert(results.length === 3);
                    assert(results[0][0] === 0);
                    assert(results[0][3] === 0);
                    assert(results[0][8] === 2); 
                    assert(results[1][0] === 0);
                    assert(results[1][3] === 0);
                    assert(results[1][8] === 2); 
                    assert(results[2][0] === 0);
                    assert(results[2][3] === 0);
                    assert(results[2][8] === 2); 
                    done();
                });
    });
    
    it('should loop each time asynchronous function passed as argument return true in its callback', function (done) {
        var i = 1;
        asynk.each([0, 1, 2], f30ms)
                .each([0, 1, 2], f10ms)
                .each([0, 1, 2], f20ms)
                .parallelLimited(5)
                .asyncLoop(function(results,cb){
                    assert(results.length === 9);
                    assert(results[0] === 0);
                    assert(results[3] === 0);
                    assert(results[8] === 2); 
                    setTimeout(function(){
                        cb(null,i++ < 3);
                    },10);
                })
                .done(function (results) {
                    assert(results.length === 3);
                    assert(results[0][0] === 0);
                    assert(results[0][3] === 0);
                    assert(results[0][8] === 2); 
                    assert(results[1][0] === 0);
                    assert(results[1][3] === 0);
                    assert(results[1][8] === 2); 
                    assert(results[2][0] === 0);
                    assert(results[2][3] === 0);
                    assert(results[2][8] === 2); 
                    done();
                });
    });

    it('should fail on error', function(done) {
      asynk.add(function(cb){
        cb('error','data');
      }).parallelLimited(5).done(function(data){
        done('should not resolve on error');
      }).fail(function(err){
        assert(err === 'error');
        done();
      });
    });  
});
