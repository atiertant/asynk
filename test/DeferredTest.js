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
/*
 
 
 
 */