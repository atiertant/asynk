var assert = require('assert');
var asynk = require('../asynk.js');

describe('Deferred', function() {
    it('Deferred.promise() should ever return same promise instance', function(done) {
        var d1 = asynk.deferred();
        assert(d1.promise() === d1.promise());
        done();
    });
    it('this must be global or undefined', function(done) {
        var d1 = asynk.deferred();
        d1.done(function() {
            assert(this === global || typeof (this) === 'undefined')
            done();
        });
        d1.resolve();
    });
    it('Deferred should not reject after resolve', function(done) {
        var d1 = asynk.deferred();
        var p1 = d1.promise();
        var failFlag = 0;
        var doneFlag = 0;
        p1.done(function() {
            doneFlag = 1;
        });
        p1.fail(function() {
            failFlag = 1;
        });
        d1.resolve();
        d1.reject();
        p1.done(function() {
            assert(failFlag === 0);
            assert(doneFlag === 1);
            done();
        });
    });
    it('Deferred should not resolve after reject', function(done) {
        var d1 = asynk.deferred();
        var p1 = d1.promise();
        var failFlag = 0;
        var doneFlag = 0;
        p1.done(function() {
            doneFlag = 1;
        });
        p1.fail(function() {
            failFlag = 1;
        });
        d1.reject();
        d1.resolve();
        p1.fail(function() {
            assert(failFlag === 1);
            assert(doneFlag === 0);
            done();
        });
    });
    it('Deferred notify(args) should execute promise progress(args)', function(done) {
        var d1 = asynk.deferred();
        var p1 = d1.promise();
        var Notify = null;
        var Obj = {};
        p1.progress(function(notify) {
          Notify = notify;
        });
        d1.notify(Obj);
        d1.resolve();
        p1.done(function() {
          assert(Notify === Obj);
          done();
        });
    });
    it('asCallback should call callback without error on resolve', function(done) {
        var d1 = asynk.deferred();
        var p1 = d1.promise();
        var cb = function(err, data) {
          if (err) {
            done('asCallback should not call callback with error on resolve');
          }
          assert(data === 55, 'asCallback should call callback with data on resolve');
          done();
        };
        p1.asCallback(cb);
        d1.resolve(55);
    });
    it('asCallback should call callback with error on reject', function(done) {
        var d1 = asynk.deferred();
        var p1 = d1.promise();
        var cb = function(err, data) {
          if (data) {
            done('asCallback should not call callback with data on reject');
          }
          assert(err === 'error', 'asCallback should call callback with data on resolve');
          done();
        };
        p1.asCallback(cb);
        d1.reject('error');
    });
    it('then should return a new promise and transform results', function(done) {
        var deferred = asynk.deferred();
        var promiseOfPerson = deferred.promise();
        var promiseOfName = promiseOfPerson.then(function(person) {
            return person.name;
        });

        promiseOfPerson.done(function(person) {
            assert(person.name === 'test');
        });

        promiseOfName.done(function(name) {
            assert(name === 'test');
            done();
        });
        deferred.resolve({name: 'test'});
    });
    it('then should return a new promise and transform errors', function(done) {
        var deferred = asynk.deferred();
        var promiseOfPerson = deferred.promise();
        var promiseOfName = promiseOfPerson.then(function(person) {
            return person.name;
        },function(err){
            return 'could not return name';
        });

        promiseOfPerson.fail(function(err) {
            assert(err === 'could not return person');
        });

        promiseOfName.fail(function(err) {
            assert(err === 'could not return name');
            done();
        });
        deferred.reject('could not return person');
    });
    it('then should take 1,2 or 3 function arguments', function(done) {
        var def_resolve = asynk.deferred();
        var def_reject = asynk.deferred();
        var pres1 = def_resolve.then(function(d){ return d; });
        var pres2 = def_resolve.then(function(d){ return d; },function(e){ return e; });
        var pres3 = def_resolve.then(function(d){ return d; },function(e){ return e; },function(n){ return n; });
        var prej1 = def_reject.then(function(d){ return d; });
        var prej2 = def_reject.then(function(d){ return d; },function(e){ return e; });
        var prej3 = def_reject.then(function(d){ return d; },function(e){ return e; },function(n){ return n; });
        def_resolve.resolve('test');
        def_reject.reject('test');
        var res = asynk.when(pres1, pres2, pres3).done(function(r1, r2, r3) {
            assert(r1 === 'test');
            assert(r2 === 'test');
            assert(r3 === 'test');
        }).fail(function(){
            done('when(resolved,resolved,resolved) should not execute when.fail()');
        });
        var rej = asynk.when(prej1, prej2, prej3).fail(function(err) {
            assert(err === 'test');
        }).done(function(r1, r2, r3){
            done('when(rejected,rejected) should not execute when.done()');
        });
        asynk.when(res,rej).done(function(r1,r2){
            done('when(resolved,rejected) should not execute when.done()');
        }).fail(function(){
            done();
        });
    });

    it('when should wait for all promise to resolve and return result in order of promises', function(done) {
        var d1 = asynk.deferred();
        var d2 = asynk.deferred();
        var d3 = asynk.deferred();

        asynk.when(d1, d2, d3).done(function(r1, r2, r3) {
            assert(typeof(r1) === 'undefined');
            assert(r2 === 1);
            assert(Array.isArray(r3));
            assert(r3[1] === 2);
            done();
        });

        d1.resolve();
        d2.resolve(1);
        d3.resolve(1, 2, 3);
    });

    it('when should fail on first reject and return the error', function(done) {
        var d1 = asynk.deferred();
        var d2 = asynk.deferred();
        var d3 = asynk.deferred();

        asynk.when(d1, d2, d3).fail(function(err) {
            assert(err === 'ERROR');
            done();
        });

        d2.reject('ERROR');
    });
});
