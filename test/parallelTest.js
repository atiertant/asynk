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
    
    it('should resolve disordered dependencies in parallel', function (done) {
        asynk.each([0, 1, 2], f30ms).require('two')
                .each([0, 1, 2], f10ms).alias('two')
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
    
    it('should loop each time argument function return true', function (done) {
        var i = 1;
        asynk.each([0, 1, 2], f30ms)
                .each([0, 1, 2], f10ms)
                .each([0, 1, 2], f20ms)
                .parallel()
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
                .parallel()
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
      }).parallel().done(function(data){
        done('should not resolve on error');
      }).fail(function(err){
        assert(err === 'error');
        done();
      });
    });  
});
