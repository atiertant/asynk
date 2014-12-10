var _ = require('underscore');


/********************************************************************************/
/* Task                                                                         */
/********************************************************************************/

var Task = function(parentStack,id,fct){
	var self = this;
	this.parentStack = parentStack;
	this.id = id;
	this.name = null;
	this.fct = fct;
	this.args = [];
	this.dependencies = [];
	this.status = 'none';
};

Task.prototype.setCallback = function(callback){
	this.callback = callback;
};

Task.prototype.execute = function(){
	var self = this;
	if (!this.checkDependencies()){
		this.status = 'waiting for dependency';
		return;
	}
	this.status = 'running';

	this.args.forEach(function(arg,index){
		if (arg instanceof DefArg){
			switch (arg.type){
				case 'order':
					if (arg.value >= 0){
						if (_.isUndefined(self.parentStack.results[arg.value])) {
							self.status = 'waiting for dependency';
							self.dependencies.push(arg.value);
						}
						else {
							self.args[index] = self.parentStack.results[arg.value];
						}
					}
					else if (arg.value < 0){
						if (_.isUndefined(self.parentStack.results[self.id + arg.value])){
							self.status = 'waiting for dependency';
							self.dependencies.push(self.id + arg.value);
						}
						else {
							self.args[index] = self.parentStack.results[self.id + arg.value];
						}
					}
					break;

				case 'results':
					self.args[index] = self.parentStack.results;
					break;

				case 'callback':
					self.args[index] = self.callback;
					break;
			}
		}
	});
	if (this.status === 'running') {
		this.fct.apply(null,this.args);
	}
};

Task.prototype.fail = function(err){
	this.status = 'fail';
	this.fct.apply(null,[err,null]);
};

Task.prototype.checkDependencies = function(){
	for (key in this.dependencies){
		var id = this.dependencies[key];
		if (_.isUndefined(this.parentStack.results[id])){
			return false;
		}
	}
	return true;
}

/********************************************************************************/
/* Deferred Argument                                                            */
/********************************************************************************/

var DefArg = function(type,val){
	this.type = type;
	this.value = val;
};

/********************************************************************************/
/* Asynk                                                                        */
/********************************************************************************/

var Asynk = function(){
    var self = this;
	this.tasks = [];
	this.results = [];
};

Asynk.prototype.add = function(fct){
	var nextId = this.tasks.length;
	this.tasks[nextId] = new Task(this,nextId,fct);
	return this;
};

Asynk.prototype.args = function(args){
	var self = this;
    var current = this.tasks[this.tasks.length - 1];
	current.args = args;
	return this;
};

Asynk.prototype.serie = function(endcall,endcallArgs){
	var self = this;
	var endTask = new Task(this,'end',endcall);
	endTask.args = endcallArgs || this.results;
	var cb = function(err, data) {
		if (!err) {
			self.results.push(data);
			self.next();
		}
		else {
			endTask.fail(err);
		}
	};
	this.next = function(){
		var current = self.tasks.shift();
		if (current){
			current.setCallback(cb);
			current.execute();
		}
		else {
			endTask.execute();
		}
	};
	this.next();
	return this;
};

Asynk.prototype.parallel = function(endcall,endcallArgs){
	var self = this;
	var endTask = new Task(this,'end',endcall);
	endTask.args = endcallArgs || this.results;

	var count = 0;
	var todo = self.tasks.length;
	var cb = function(task,err,data){
		this.status = 'done';
		if (!err) {
			self.results[task.id] = data;
			count++;
			if (count >= todo) {
				endTask.execute();
			}
			else {
				self.tasks.forEach(function(task) {
					if (task.status === 'waiting for dependency') {
						task.execute();
					}
				});
			}
		}
		else {
			endTask.fail(err);
		}
	};

	this.tasks.forEach(function(task) {
		task.setCallback(function(err,data){
			cb(task,err,data);
		});
	});

	this.tasks.forEach(function(task) {
			task.execute();
	});

	return this;
};

Asynk.prototype.require = function(dependency){
	var current = this.tasks[this.tasks.length - 1];
	current.dependencies.push(dependency);
	return this;
};


module.exports = {
	add: function(fct){
		return new Asynk().add(fct);
	},
	callback:  new DefArg("callback"),
	data: function(val){
		if (val === 'all') {
			return new DefArg("results","all");
		}
		else {
			return new DefArg("order",val);
		}
	}
};


