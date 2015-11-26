var assert = require('assert');
var asynk = require('../asynk.js');

describe('Deferred', function () {
    it('Deferred.promise() should ever return same promise instance', function (done) {
        var d1 = asynk.deferred();
        assert(d1.promise() === d1.promise());
        done();
    });
    it('this must be global or undefined', function (done) {
        var d1 = asynk.deferred();
        d1.done(function () {
            assert(this === global || typeof (this) === 'undefined')
            done();
        });
        d1.resolve();
    });
    it('Deferred should not reject after resolve', function (done) {
        var d1 = asynk.deferred();
        var p1 = d1.promise();
        var failFlag = 0;
        var doneFlag = 0;
        p1.done(function () {
            doneFlag = 1;
        });
        p1.fail(function () {
            failFlag = 1;
        });
        d1.resolve();
        d1.reject();
        p1.done(function () {
            assert(failFlag === 0);
            assert(doneFlag === 1);
            done();
        });
    });
    it('Deferred should not resolve after reject', function (done) {
        var d1 = asynk.deferred();
        var p1 = d1.promise();
        var failFlag = 0;
        var doneFlag = 0;
        p1.done(function () {
            doneFlag = 1;
        });
        p1.fail(function () {
            failFlag = 1;
        });
        d1.reject();
        d1.resolve();
        p1.fail(function () {
            assert(failFlag === 1);
            assert(doneFlag === 0);
            done();
        });
    });

    it('then should return a new promise and transform results', function (done) {
        var promiseOfPerson = asynk.deferred();
        var promiseOfName = promiseOfPerson.then(function (person) {
            return person.name;
        });

        promiseOfPerson.done(function (person) {
            assert(person.name === 'test');
        });

        promiseOfName.done(function (name) {
            assert(name === 'test');
        });
        promiseOfPerson.resolve({name: 'test'});
        promiseOfPerson.done(function () {
            done();
        });
    });
    it('then should return a new promise and transform errors', function (done) {
        var promiseOfPerson = asynk.deferred();
        var promiseOfName = promiseOfPerson.then(function (person) {
            return person.name;
        },function(err){
            return 'could not return name';
        });

        promiseOfPerson.fail(function (err) {
            assert(err === 'could not return person');
        });

        promiseOfName.fail(function (err) {
            assert(err === 'could not return name');
        });
        promiseOfPerson.reject('could not return person');
        promiseOfPerson.fail(function () {
            done();
        });
    });
    it('then should take 1,2 or 3 function arguments', function (done) {
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
        var res = asynk.when(pres1, pres2, pres3).done(function (r1, r2, r3) {
            assert(r1 === 'test');
            assert(r2 === 'test');
            assert(r3 === 'test');
        }).fail(function(){
            done('when(resolved,resolved,resolved) should not execute when.fail()');
        });
        var rej = asynk.when(prej1, prej2, prej3).fail(function (r1, r2, r3) {
            assert(r1 === 'test');
            assert(r2 === void 0);
            assert(r3 === void 0);
        }).done(function(r1, r2, r3){
            done('when(rejected,rejected) should not execute when.done()');
        });
        asynk.when(res,rej).done(function(r1,r2){
            done('when(resolved,rejected) should not execute when.done()');
        }).fail(function(){
            done();
        });
    });
    it('when should wait for all promise to resolve en return result in order of promises', function (done) {
        var d1 = asynk.deferred();
        var d2 = asynk.deferred();
        var d3 = asynk.deferred();

        asynk.when(d1, d2, d3).done(function (r1, r2, r3) {
            assert(typeof(r1) === 'undefined');
            assert(r2 === 1);
            assert(Array.isArray(r3));
            assert(r3[1] === 2);
        });

        d1.resolve();
        d2.resolve(1);
        d3.resolve(1, 2, 3);
        done();
    });
});
