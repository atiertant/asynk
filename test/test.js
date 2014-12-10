var log = require('captains-log')();
var asynk = require('../asynk.js');

log.info('Testing asynk');

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

var passed = 0;
var error = 0;

function check(test,data,shouldbe){
	if (data.length === shouldbe.length){
		for(i in data) {
			if (data[i] !== shouldbe[i]){
				log.warn('Test '+test+' ERROR invalid data '+i);
				log.warn(data);
				error++;
				return;
			}
		}
		log.info('Test '+test+' OK');
		passed++;
		return;
	}
	log.warn('Test '+test+' ERROR');
	log.warn(data);
	error++;
	return;
}


asynk.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.serie(check,['serie',asynk.data('all'),[0,1,2]]);


asynk.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.parallel(check,['parallel',asynk.data('all'),[0,1,2]]);

asynk.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([1,asynk.callback])
	.add(f200ms).args([2,asynk.callback])
	.parallelLimited(3,check,['parallelLimited',asynk.data('all'),[ 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2 ]]);




asynk.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([asynk.data(0),asynk.callback])
	.add(f300ms).args([1,asynk.callback])
	.add(f200ms).args([asynk.data(2),asynk.callback])
	.add(f200ms).args([asynk.data(-3),asynk.callback])
	.serie(check,['data order in serie',asynk.data('all'),[0,0,1,1,0]]);

asynk.add(f300ms).args([0,asynk.callback]).alias('one')
	.add(f100ms).args([asynk.data('one'),asynk.callback]).alias('two')
	.add(f300ms).args([1,asynk.callback]).alias('tree')
	.add(f200ms).args([asynk.data('tree'),asynk.callback])
	.add(f200ms).args([asynk.data('two'),asynk.callback])
	.serie(check,['data alias in serie',asynk.data('all'),[0,0,1,1,0]]);

asynk.add(f300ms).args([0,asynk.callback]).require(2)
	.add(f100ms).args([1,asynk.callback]).require(0)
	.add(f200ms).args([2,asynk.callback])
	.parallel(check,['require in parallel',asynk.data('all'),[0,1,2]]);

asynk.add(f300ms).args([0,asynk.callback]).require('tree').alias('one')
	.add(f100ms).args([1,asynk.callback]).require('one').alias('two')
	.add(f200ms).args([2,asynk.callback]).alias('tree')
	.parallel(check,['require with alias',asynk.data('all'),[0,1,2]]);


asynk.add(f300ms).args([0,asynk.callback])
	.add(f100ms).args([asynk.data(0),asynk.callback])
	.add(f300ms).args([1,asynk.callback])
	.add(f200ms).args([asynk.data(2),asynk.callback])
	.add(f200ms).args([asynk.data(-3),asynk.callback])
	.parallel(check,['data order in parallel',asynk.data('all'),[0,0,1,1,0]]);


//log.info('Passed '+passed);
//log.warn('Error: '+error);
