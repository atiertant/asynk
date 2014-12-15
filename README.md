# Asynk.js

Asynk is small tool for javascript asynchronous task management.

## Example

```javascript
asynk.add(fs.open).args('./TEST.txt','w',asynk.callback)
	.add(fs.write).args(asynk.data(0),new Buffer('hello world'),0,11,null,asynk.callback)
	.add(fs.close).args(asynk.data(-2),asynk.callback)
	.add(fs.readFile).args('./TEST.txt', "utf8",asynk.callback).alias('content')
	.serie(console.log,[asynk.data('content')]);
//Log 'hello world' in console
```

Asynk adapt to fit your functions syntax without writting a warper function and can dynimaquely get results from a task output back to an other input and more...
see full documentation below.

## Installation

Install from NPM.

```bash
$ npm install asynk
```

## Adding Task

Asynk command **must** start by adding one or more task using functions: 

### Add

```javascript
asynk.add(my_function).args(my_first_argument,asynk.callback) //...
```

this make asynk create a manager with one task

### Each

```javascript
asynk.each([0,1,2],my_function).args(asynk.item,asynk.callback) //...
```

this make asynk create a manager with tree tasks(asynk.item is on value of the array in input) witch is the equivalent of: 

```javascript
asynk.add(my_function).args(0,asynk.callback)
	.add(my_function).args(1,asynk.callback)
	.add(my_function).args(2,asynk.callback) //...
```
## Args
args(arg1,arg2,...)

the args function define arguments of function passed to the task.
simply pass arguments like executing the function and replace the callback function by *asynk.callback* 

## Execute them

Asynk command must finnish by choosing an excution mode:

### Serie 
serie(function,args)

in this mode,all task are execute one by one in the order they where inserted.

```javascript
asynk.each(['one','two'],my_function).args(asynk.item,asynk.callback)
	.serie(console.log,[asynk.data('all')]);
```

here my_function is called with argument 'one',once this function ended,the same function is called with argument 'two'.
when every task are finnished,the function passed to serie is called with args arguments array.

### Parallel
parallel(function,args)

in this mode,all task are started at the same time.

```javascript
asynk.each(['one','two'],my_function).args(asynk.item,asynk.callback)
	.parallel(console.log,[asynk.data('all')]);
```

here my_function is called with argument 'one' and a second time with 'two' without waiting anything.
when every task are finnished,the function passed to parallel is called with args arguments array.

### ParallelLimited
parallelLimited(limit,function,args)

in this mode,a predefined number(limit) of task are running in the same time.

```javascript
asynk.each([0,0,0,0],my_function).args(asynk.item,asynk.callback)
	.parallelLimited(2,console.log,[asynk.data('all')]);
```

here my_function is called four time with 0 as argument but two time before and one time after a callback is called until all four tasks are done.
when every task are finnished,the function passed to parallelLimited is called with args arguments array.

## Asynchronous data between task

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
asynk.data can take arguments like:

* **positive number:** return the value of task by absolute order of insertion starting by 0 (so 0 is the first,1 is the second...)
* **negative number:** return the value of task in a relative position (-1 is the first previous one)
* **string:** return the value of task named by alias(string) function

## Advanced Task Functionality

### Require
require(dependency)

require function make task waiting an other one to finish before start.

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

here my_function0 and my_function4 will be execute first,then on my_function4's end,my_function1 and my_function2 will be execute.
and so on my_function2's end,my_function3 will be execute.

require can take arguments like:

* **positive number:** require a selected task by absolute order of insertion starting by 0 (so 0 is the first,1 is the second...).
* **negative number:** require a selected task by a relative position (-1 is the first previous one).
* **string:** require a selected task named by alias(string) function.
