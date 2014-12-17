var _ = require('underscore');
var colors = require('colors');
var asynk = require('../asynk.js');

console.log('Testing asynk');

function f100ms(arg,cb){
	setTimeout(function(){
		cb(false,arg); 
	}, 100);
}

function f200ms(arg,cb){
	setTimeout(function(){
		cb(false,arg);
	}, 200);
}

function f300ms(arg,cb){
	setTimeout(function(){
		cb(false,arg);
	}, 300);
}


var count = 0;
var tests = [];

function check(test,data,shouldbe){
	if (data.length === shouldbe.length){
		for(i in data) {
			if (data[i] !== shouldbe[i]){
				tests.push({test: test,status: 'failed'});
				return isEnd();
			}
		}
		tests.push({test: test,status: 'passed'});
		return isEnd();
	}
	tests.push({test: test,status: 'failed'});
	return isEnd();
}

function isEnd(){
	if (tests.length === count) {
		var stats = _.countBy(tests, function(test) {
  			return test.status;
		});
		var passed = 'Passed : ' + (stats.passed || 0);
		var failed = 'failed : ' + (stats.failed || 0);
		console.log(passed.green);
		console.log(failed.red);
	}
}

count++; //serie
asynk.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.serie(check,['serie',asynk.data('all'),[0,1,2]]);

count++; //parallel
asynk.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.parallel(check,['parallel',asynk.data('all'),[0,1,2]]);

count++; //parallelLimited
asynk.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(1,asynk.callback)
	.add(f200ms).args(2,asynk.callback)
	.parallelLimited(3,check,['parallelLimited',asynk.data('all'),[ 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2 ]]);



count++; //data order in serie
asynk.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(asynk.data(0),asynk.callback)
	.add(f300ms).args(1,asynk.callback)
	.add(f200ms).args(asynk.data(2),asynk.callback)
	.add(f200ms).args(asynk.data(-3),asynk.callback)
	.serie(check,['data order in serie',asynk.data('all'),[0,0,1,1,0]]);

count++; //data alias in serie
asynk.add(f300ms).args(0,asynk.callback).alias('one')
	.add(f100ms).args(asynk.data('one'),asynk.callback).alias('two')
	.add(f300ms).args(1,asynk.callback).alias('tree')
	.add(f200ms).args(asynk.data('tree'),asynk.callback)
	.add(f200ms).args(asynk.data('two'),asynk.callback)
	.serie(check,['data alias in serie',asynk.data('all'),[0,0,1,1,0]]);

count++; //require in parallel
asynk.add(f300ms).args(0,asynk.callback).require(2)
	.add(f100ms).args(1,asynk.callback).require(0)
	.add(f200ms).args(2,asynk.callback)
	.parallel(check,['require in parallel',asynk.data('all'),[0,1,2]]);

count++; //require with alias
asynk.add(f300ms).args(0,asynk.callback).require('tree').alias('one')
	.add(f100ms).args(1,asynk.callback).require('one').alias('two')
	.add(f200ms).args(2,asynk.callback).alias('tree')
	.parallel(check,['require with alias',asynk.data('all'),[0,1,2]]);

count++; //data order in parallel
asynk.add(f300ms).args(0,asynk.callback)
	.add(f100ms).args(asynk.data(0),asynk.callback)
	.add(f300ms).args(1,asynk.callback)
	.add(f200ms).args(asynk.data(2),asynk.callback)
	.add(f200ms).args(asynk.data(-3),asynk.callback)
	.parallel(check,['data order in parallel',asynk.data('all'),[0,0,1,1,0]]);

count++; //each in parallel
asynk.each([0,1,2],f300ms).args(asynk.item,asynk.callback)
	.each([0,1,2],f100ms).args(asynk.item,asynk.callback)
	.each([0,1,2],f200ms).args(asynk.item,asynk.callback)
	.parallel(check,['each in parallel',asynk.data('all'),[0,1,2,0,1,2,0,1,2]]);

count++; //fifo
var fifo = asynk.fifo();
var result = '';
var f1 = fifo.push(function(err,data){result += data;});
var f2 = fifo.push(function(err,data){result += data;});
var f3 = fifo.push(function(err,data){result += data;});
var f4 = fifo.push(function(err,data){result += data;});
var f5 = fifo.push(function(err,data){result += data;});
var f6 = fifo.push(function(err,data){result += data;});
f6(null,6);
f2(null,2);
f4(null,4);
f1(null,1);
f3(null,3);
f5(null,5);
check('fifo',[result],['123456']);


count++; //progressive
var progr = asynk.progressive();
var result = '';
progr.push(6,function(err,data){result += data;})(null,6);
progr.push(2,function(err,data){result += data;})(null,2);
progr.push(4,function(err,data){result += data;})(null,4);
progr.push(1,function(err,data){result += data;})(null,1);
progr.push(3,function(err,data){result += data;})(null,3);
progr.push(5,function(err,data){result += data;})(null,5);
check('progressive',[result],['123456']);