var assert = require('assert');
var asynk = require('../asynk.js');
var utils = require('../lib/utils');


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
    it('should insert a function per data in array passed to each', function (done) {
        asynk.each([0, 1, 2], f30ms)
                .each([0, 1, 2], f10ms)
                .each([0, 1, 2], f20ms)
                .serie()
                .done(function (results) {
                    assert(results.length === 9);
                    assert(results[0] === 0);
                    assert(results[3] === 0);
                    assert(results[8] === 2);
                    done();
                });
    });
    
    it('should not resolve disordered dependencies in serie', function (done) {
        asynk.each([0, 1, 2], f30ms).require('two')
                .each([0, 1, 2], f10ms).alias('two')
                .each([0, 1, 2], f20ms)
                .serie()
                .done(function () {
                    assert(false,'wrong resolution of dependancies');
                    done();
                })
                .fail(function (errors) {
                    assert(utils.isDefined(errors));
                    done();
                });
    });
    
    it('should loop each time argument function return true', function (done) {
        var i = 1;
        asynk.each([0, 1, 2], f30ms)
                .each([0, 1, 2], f10ms)
                .each([0, 1, 2], f20ms)
                .serie()
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
                .serie()
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
      }).serie().done(function(data){
        done('should not resolve on error');
      }).fail(function(err){
        assert(err === 'error');
        done();
      });
    });
});