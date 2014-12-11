var _ = require('underscore');


/********************************************************************************/
/* Task                                                                         */
/********************************************************************************/

var Task = function(parentStack,id,fct){
	var self = this;
	this.parentStack = parentStack;
	this.id = id;
	this.alias = null;
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

				case 'alias':
					if (arg.value === 'all') {
						self.args[index] = self.parentStack.results;
					}
					else {
						self.args[index] = self.parentStack.results[self.parentStack.aliasMap[arg.value]];
					}
					break;
				case 'callback':
					self.args[index] = self.callback;
					break;

				case 'item':
					self.args[index] = self.item;
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

		if (_.isString(id)) {
			id = this.parentStack.aliasMap[id];
		}

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
	this.aliasMap = [];
	this.results = [];
	this.currentTasks = [];
};

Asynk.prototype.add = function(fct){
	var newId = this.tasks.length;
	this.tasks[newId] = new Task(this,newId,fct);
	this.currentTasks = [newId];
	return this;
};

Asynk.prototype.each = function(datas,fct){
	var self = this;
	datas.forEach(function(data){
		var newId = self.tasks.length;
		self.tasks[newId] = new Task(self,newId,fct);
		self.tasks[newId].item = data;
		self.currentTasks.push(newId);		
	});
	return this;
};

Asynk.prototype.args = function(){
	args = _.toArray(arguments);
	var self = this;
	this.currentTasks.forEach(function(currentTask){
    	self.tasks[currentTask].args = _.clone(args);
	});
	return this;
};

Asynk.prototype.require = function(dependency){
	var self = this;
	this.currentTasks.forEach(function(currentTask){
		var current = self.tasks[currentTask];
		current.dependencies.push(dependency);
	});
	return this;
};

Asynk.prototype.alias = function(alias){
	if (_.isString(alias)) {
		var self = this;
		this.currentTasks.forEach(function(currentTask,index){
			if (self.currentTasks.length > 1){
				alias += index;
			}
			self.tasks[currentTask].alias = alias;
			self.aliasMap[alias] = currentTask;
		});
	}
	return this;
}

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
		task.status = 'done';
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

Asynk.prototype.parallelLimited = function(limit,endcall,endcallArgs){
	var self = this;
	var endTask = new Task(this,'end',endcall);
	endTask.args = endcallArgs || this.results;

	var count = 0;
	var todo = self.tasks.length;
	var cb = function(task,err,data){
		task.status = 'done';
		if (!err) {
			self.results[task.id] = data;
			count++;
			if (count >= todo) {
				endTask.execute();
			}
			else {
				self.tasks.forEach(function(task) {
					var stats = _.countBy(self.tasks, function(task) {
  						return task.status;
					});
					var running = stats.running || 0;
					if ((running < limit) && (task.status !== 'done') && (task.status !== 'running') && (task.status !== 'fail')) {
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
		var stats = _.countBy(self.tasks, function(task) {
  			return task.status;
		});
		var running = stats.running || 0;
		if ((running < limit) && (task.status !== 'done') && (task.status !== 'running') && (task.status !== 'fail')) {
			task.execute();
		}
	});

	return this;
};

module.exports = {
	add: function(fct){
		return new Asynk().add(fct);
	},
	each: function(datas,fct){
		return new Asynk().each(datas,fct);
	},
	callback:  new DefArg('callback'),
	data: function(val){
		if (_.isString(val)) {
			return new DefArg('alias',val);
		}
		else {
			return new DefArg('order',val);
		}
	},
	item: new DefArg('item')
};


