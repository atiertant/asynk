![asynk.js](http://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Break_dance.svg/512px-Break_dance.svg.png)Asynk.js
--------

Asynk is a feature-rich JavaScript library designed to simplify common asynchronous JavaScript programming tasks.


## Example

```javascript
asynk.add(fs.open).args('./TEST.txt','w',asynk.callback)
	.add(fs.write).args(asynk.data(0),new Buffer('hello world'),0,11,null,asynk.callback)
	.add(fs.close).args(asynk.data(-2),asynk.callback)
	.add(fs.readFile).args('./TEST.txt', "utf8",asynk.callback).alias('content')
	.serie([asynk.data('content')]).done(console.log);
//Log 'hello world' in console
```

Asynk adapt to fit your functions syntax without writting a warper function and can dynamically get results from a task output back to an other input and more...
see full documentation below.

## Installation

Install from NPM.

```bash
$ npm install asynk
```

## License

MIT

## Adding Task

Asynk command **must** start by adding one or more task using functions: 

### Add
*add(fct)*

add one task

arguments:
* fct: an asynchronous function (default arguments value is [asynk.callback])

```javascript
asynk.add(my_function).args(my_first_argument,asynk.callback) //...
```

this make asynk create a manager with one task

### Each
*each(array_data,fct)*

add a task per array's item of the same function

arguments:
* array_data: an array of data
* fct: an asynchronous function (default arguments value is [asynk.item,asynk.callback])

```javascript
asynk.each([0,1,2],my_function).args(asynk.item,asynk.callback) //...
```

this make asynk create a manager with tree tasks(asynk.item is on value of the array in input) witch is the equivalent of: 

```javascript
asynk.add(my_function).args(0,asynk.callback)
	.add(my_function).args(1,asynk.callback)
	.add(my_function).args(2,asynk.callback) //...
```
### Args
*args(arg1,arg2,...)*

arguments:
* arg1: the first argument of the task function
* arg2: the second argument of the task function
* ...

the args function define arguments of function passed to the task.
simply pass arguments like executing the function and replace the callback function by *asynk.callback* 

```javascript
asynk.add(my_function).args(0,asynk.callback) //...
```
will execute the function like this :

```javascript
function callback(err,data){
	//the callback function
}
my_function(0,callback); //...
```

#### Data
*asynk.data(task)*

data put output of a task to the input of another one.

arguments:
* task :
	* **positive number:** return the value of task by absolute order of insertion starting by 0 (so 0 is the first,1 is the second...)
	* **negative number:** return the value of task in a relative position (-1 is the first previous one)
	* **string:** return the value of task named by alias(string) function

```javascript
//create a first task
asynk.add(my_function).args(0,asynk.callback)
	//absolute position task data (here first one)
	.add(my_function).args(asynk.data(0),asynk.callback)
	//relative position task data (here the second one)
	.add(my_function).args(asynk.data(-1),asynk.callback)
	//assinging an alias name to this task
	.add(my_function).args(0,asynk.callback).alias('here')
	//alias name task data (here the fourth)
	.add(my_function).args(asynk.data('here'),asynk.callback)
	//...
```

### Require
*require(dependency)*

require function make task waiting an other one to finish before start.

arguments:
* dependency:
	* **positive number:** require a selected task by absolute order of insertion starting by 0 (so 0 is the first,1 is the second...).
	* **negative number:** require a selected task by a relative position (-1 is the first previous one).
	* **string:** require a selected task named by alias(string) function.

```javascript
//create a first task
asynk.add(my_function0).args(0,asynk.callback)
	//alias name task requirement (here the fifth)
	.add(my_function1).args(4,asynk.callback).require('here')
	//absolute position task requirement (here the fifth)
	.add(my_function2).args(1,asynk.callback).require(4)
	//relative position task requirement (here the third)		
	.add(my_function3).args(2,asynk.callback).require(-1)
	//assinging an alias name to this task
	.add(my_function4).args(3,asynk.callback).alias('here')
	//...
```

here my_function0 and my_function4 will be execute first.
then on my_function4's end,my_function1 and my_function2 will be execute.
and so on my_function2's end,my_function3 will be execute.

## Launch the execution

Asynk command must finnish by choosing an excution mode:

### Serie 
*serie(args)*

arguments:
* args: an array of arguments to pass to fct ( default is asynk.data('all') )

return: a promise

in this mode,all task are execute one by one in the order they where inserted.

```javascript
asynk.each(['one','two'],my_function).args(asynk.item,asynk.callback)
	.serie().done(console.log);
```

here my_function is called with argument 'one',once this function ended,the same function is called with argument 'two'.
when every task are finnished,the function passed to serie is called with args arguments array.

### Parallel
*parallel(args)*

arguments:
* args: an array of arguments that are passed to doneCallbacks ( default is asynk.data('all') )

return: a promise

in this mode,all task are started at the same time.

```javascript
asynk.each(['one','two'],my_function).args(asynk.item,asynk.callback)
	.parallel().done(console.log);
```

here my_function is called with argument 'one' and a second time with 'two' without waiting anything.
when every task are finnished,the function passed to parallel is called with args arguments array.

### ParallelLimited
*parallelLimited(limit,args)*

arguments:
* limit: an integer number of maximum parallel task to execute
* args: an array of arguments to pass to fct ( default is asynk.data('all') )

return: a promise

in this mode,a predefined number(limit) of task are running in the same time.

```javascript
asynk.each([0,0,0,0],my_function).args(asynk.item,asynk.callback)
	.parallelLimited(2).done(console.log);
```

here my_function is called four time with 0 as argument but two time before and one time after a callback is called until all four tasks are done.
when every task are finnished,the function passed to parallelLimited is called with args arguments array.

## Deffered

### Asynk.deffered
*asynk.deffered()*

A factory function that returns a chainable utility object with methods to register multiple callbacks into callback queues, invoke callback queues, and relay the success or failure state of any synchronous or asynchronous function.

return: a deffered object

```javascript
var defered = asynk.deferred();
var promise = defered.promise();
promise.done(function(arg){
  console.log('hello ' + arg);
});
defered.resolve('world');
```

### Always
*always(fct)*

Add function to be called when the deferred object is either resolved or rejected.

arguments:
* fct: a function called when deferred object is resolved or rejected.

return: the deffered/promise object

### Done
*done(fct)*

Add function to be called when the deferred object is resolved.

arguments:
* fct: a function called when deferred object is resolved.

return: the deffered/promise object

### Fail
*fail(fct)*

Add function to be called when the deferred object is rejected.

arguments:
* fct: a function called when deferred object is rejected.

return: the deffered/promise object

### IsRejected
*isRejected()*

Determine whether a deferred object has been rejected.

return: a boolean

### IsResolved
*isResolved()*

Determine whether a deferred object has been resolved.

return: a boolean

### Notify
*notify(args)*

Call the progressCallbacks on a deferred object with the given args.

arguments:
* args: optional agruments passed to progessCallbacks.

return: the deffered object

### NotifyWith
*notifyWith(context, args)*

Call the progressCallbacks on a deferred object with the given context and args.

arguments:
* context: context passed to progressCallbacks as the `this` object.
* args: optional array of agruments passed to progessCallbacks.

return: the deffered object

### Pipe
*pipe(doneFilter)*

Utility method to filter and/or chain deferreds.

arguments:
*doneFilter: A function called as doneCallback that return is passed to pipe returned promise doneCallbacks as arguments.

return: a promise object

### Progress
*progress(fct)*

Add function to be called when the deferred object generates progress notifications.

arguments:
* fct: a function called when deferred object notify function is called.

return: the deffered/promise object

### Promise
*promise(obj)*

Return a deferred’s Promise object.

arguments:
* obj: object that receive promise's functions.

return: a promise object

### Reject
*reject(args)*

Reject a deferred object and call any failCallbacks with the given args.

arguments:
* args: arguments that are passed to the failCallbacks.

return: the deffered/promise object

### RejectWith
*rejectWith(context, args)*

Reject a deferred object and call any failCallbacks with the given context and args.

arguments:
* context: context passed to failCallbacks as the `this` object.
* args: optional array of agruments passed to failCallbacks.

return: the deffered object

### Resolve
*resolve(args)*

Resolve a deferred object and call any doneCallbacks with the given args.

arguments:
* args: arguments that are passed to the doneCallbacks.

return: the deffered/promise object

### ResolveWith
*resolveWith(context, args)*

Resolve a deferred object and call any doneCallbacks with the given context and args.

arguments:
* context: context passed to doneCallbacks as the `this` object.
* args: optional array of agruments passed to doneCallbacks.

return: the deffered object

### State
*state()*

Determine the current state of a deferred object.

return: a string('pending','resolved' or 'rejected')

### Then
*then(doneFilter, failFilter, progressFilter)*

Add functions to be called when the deferred object is resolved, rejected, or still in progress.

arguments:
* doneFilter: A function called as doneCallback that return is passed to then returned promise doneCallbacks as arguments.
* failFilter: A function called as failCallback that return is passed to then returned promise doneCallbacks as arguments.
* progressFilter: A function called as progressCallback that return is passed to then returned promise progressCallbacks as arguments.

return: a promise object

### When
*when(deferreds)*

Provides a way to execute callbacks functions based on one or more deferred objects that represent asynchronous events.

arguments:
* deferreds: a list of deferred or plain javascript objects.

return: a promise object

## Stacks

### Fifo
first pushed function are first executed

create a fifo stack object:
```javascript
var fifo = asynk.fifo();
```
*push(fct)*
arguments:
* fct: a function

return a function that take fct arguments as arguments

```javascript
var result = '';
var fifo = asynk.fifo();
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
console.log(result); //123456
```

### Progressive
function are executed in a predefined order

create a progressive stack object:
```javascript
var progr = asynk.progressive(start,step);
```
arguments:
* start: a number (first order to execute) default value is 1
* step: a number (step between order) default value is 1

*push(order,fct)*
arguments:
* order: a number
* fct: a function

```javascript
var result = '';
var progr = asynk.progressive();
progr.push(6,function(err,data){result += data;})(null,6);
progr.push(2,function(err,data){result += data;})(null,2);
progr.push(4,function(err,data){result += data;})(null,4);
progr.push(1,function(err,data){result += data;})(null,1);
progr.push(3,function(err,data){result += data;})(null,3);
progr.push(5,function(err,data){result += data;})(null,5);
console.log(result); //123456
```