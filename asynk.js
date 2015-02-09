var _ = require('underscore');

/********************************************************************************/
/* Static state of task                                                         */
/********************************************************************************/
var WAITING = 0;
var WAITING_FOR_DEPENDENCY = 1;
var RUNNING = 2;
var DONE = 3;
var FAIL = 4;


/********************************************************************************/
/* Task                                                                         */
/********************************************************************************/

var Task = function(parentStack, id, fct) {
    var self = this;
    this.parentStack = parentStack;
    this.id = id;
    this.alias = null;
    this.fct = fct;
    this.args = [];
    this.dependencies = [];
    this.status = WAITING;
};

Task.prototype.setCallback = function(callback) {
    this.callback = callback;
};

Task.prototype.execute = function() {
    var self = this;
    if (!this.checkDependencies()) {
        this.status = WAITING_FOR_DEPENDENCY;
        return;
    }
    this.status = RUNNING;

    this.args.forEach(function(arg, index) {
        if (arg instanceof DefArg) {
            self.args[index] = arg.resolve(self);
        }
    });
    if (this.status === RUNNING) {
        this.fct.apply(null, this.args);
    }
};

Task.prototype.fail = function(err) {
    this.status = FAIL;
    this.fct.apply(null, [err, null]);
};

Task.prototype.checkDependencies = function() {
    for (key in this.dependencies) {
        var id = this.dependencies[key];

        if (_.isString(id)) {
            id = this.parentStack.aliasMap[id];
        }

        if (_.isUndefined(this.parentStack.results[id])) {
            return false;
        }
    }
    return true;
};

/********************************************************************************/
/* Deferred Argument                                                            */
/********************************************************************************/

var DefArg = function(type, val) {
    this.type = type;
    this.value = val;
};

DefArg.prototype.resolve = function(task) {
    switch (this.type) {
        case 'order':
            if (this.value >= 0) {
                if (_.isUndefined(task.parentStack.results[this.value])) {
                    task.status = WAITING_FOR_DEPENDENCY;
                    task.dependencies.push(this.value);
                    return this;
                }
                else {
                    return task.parentStack.results[this.value];
                }
            }
            else if (this.value < 0) {
                if (_.isUndefined(task.parentStack.results[task.id + this.value])) {
                    task.status = WAITING_FOR_DEPENDENCY;
                    task.dependencies.push(task.id + this.value);
                    return this;
                }
                else {
                    return task.parentStack.results[task.id + this.value];
                }
            }
            break;

        case 'alias':
            if (this.value === 'all') {
                return task.parentStack.results;
            }
            else {
                return task.parentStack.results[task.parentStack.aliasMap[this.value]];
            }
            break;

        case 'callback':
            return task.callback;
            break;

        case 'item':
            return task.item;
            break;
    }
};

/********************************************************************************/
/* progressive                                                                  */
/********************************************************************************/
var Progressive = function(start, step) {
    this.step = step || 1;
    this.last = (_.isUndefined(start) ? 1 : start) - this.step;
    this.stack = [];
};

Progressive.prototype.push = function(order, fct) {
    var self = this;
    var task = {order: order, fct: fct};
    this.stack.push(task);

    return function(){
        task.args = _.toArray(arguments);
        var reCheck = true;
        while (reCheck) {
            reCheck = false;
            for(i in self.stack){        
                var queued = self.stack[i];
                if (queued.order === (self.last + self.step)) {
                    if (!_.isUndefined(queued.args)) {
                        queued.fct.apply(null, queued.args);
                        self.stack.slice(i, 1);
                        self.last += self.step;
                        reCheck = true;
                    }
                    else {
                        reCheck = false;
                        break;
                    }
                }
            }
        }
    };
};

/********************************************************************************/
/* Fifo                                                                         */
/********************************************************************************/
var Fifo = function() {
    this.stack = [];
};
Fifo.prototype.push = function(fct) {
    var self = this;
    var task = {};
    task.fct = fct;
    this.stack.push(task);
    return function() {
        task.args = _.toArray(arguments);
        if (self.stack[0] === task) {
            while (self.stack.length && !_.isUndefined(self.stack[0].args)) {
                var callback = self.stack.shift();
                callback.fct.apply(null, callback.args);
            }
        }
    };
};

/********************************************************************************/
/* Asynk                                                                        */
/********************************************************************************/

var Asynk = function() {
    var self = this;
    this.tasks = [];
    this.aliasMap = [];
    this.results = [];
    this.currentTasks = [];
};

Asynk.prototype.add = function(fct) {
    if ( _.isUndefined(fct) || !_.isFunction(fct) ) {
        throw new Error('Asynk add require a function as argument');
    }
    var newId = this.tasks.length;
    this.tasks[newId] = new Task(this, newId, fct);
    this.currentTasks = [newId];
    return this;
};

Asynk.prototype.each = function(datas, fct) {
    if ( _.isUndefined(fct) || !_.isFunction(fct) ) {
        throw new Error('Asynk each require a function as second argument');
    }
    var self = this;
    self.currentTasks = [];
    datas.forEach(function(data) {
        var newId = self.tasks.length;
        self.tasks[newId] = new Task(self, newId, fct);
        self.tasks[newId].item = data;
        self.currentTasks.push(newId);
    });
    return this;
};

Asynk.prototype.args = function() {
    args = _.toArray(arguments);
    var self = this;
    this.currentTasks.forEach(function(currentTask) {
        self.tasks[currentTask].args = _.clone(args);
    });
    return this;
};

Asynk.prototype.require = function(dependency) {
    var self = this;
    this.currentTasks.forEach(function(currentTask) {
        var current = self.tasks[currentTask];
        current.dependencies.push(dependency);
    });
    return this;
};

Asynk.prototype.alias = function(alias) {
    if (_.isString(alias)) {
        var self = this;
        this.currentTasks.forEach(function(currentTask, index) {
            if (self.currentTasks.length > 1) {
                alias += index;
            }
            self.tasks[currentTask].alias = alias;
            self.aliasMap[alias] = currentTask;
        });
    }
    return this;
};

Asynk.prototype.serie = function(endcall, endcallArgs) {
    if ( _.isUndefined(endcall) || !_.isFunction(endcall) ) {
        throw new Error('Asynk serie require a function as first argument');
    }
    var self = this;
    var endTask = new Task(this, 'end', endcall);
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
    this.next = function() {
        var current = self.tasks.shift();
        if (current) {
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

Asynk.prototype.parallel = function(endcall, endcallArgs) {
    if ( _.isUndefined(endcall) || !_.isFunction(endcall) ) {
        throw new Error('Asynk parallel require a function as first argument');
    }
    var self = this;
    var endTask = new Task(this, 'end', endcall);
    endTask.args = endcallArgs || this.results;

    var count = 0;
    var todo = self.tasks.length;
    var cb = function(task, err, data) {
        task.status = DONE;
        if (!err) {
            self.results[task.id] = data;
            count++;
            if (count >= todo) {
                endTask.execute();
            }
            else {
                self.tasks.forEach(function(task) {
                    if (task.status === WAITING_FOR_DEPENDENCY) {
                        task.execute();
                    }
                });
            }
        }
        else {
            endTask.fail(err);
        }
    };
    
    if (this.tasks.length === 0){
        endTask.execute();
        return this;
    }
    
    this.tasks.forEach(function(task) {
        task.setCallback(function(err, data) {
            cb(task, err, data);
        });
    });

    this.tasks.forEach(function(task) {
        task.execute();
    });

    return this;
};

Asynk.prototype.parallelLimited = function(limit, endcall, endcallArgs) {
    if ( _.isUndefined(endcall) || !_.isFunction(endcall) ) {
        throw new Error('Asynk parallelLimited require a function as second argument');
    }
    var self = this;
    var endTask = new Task(this, 'end', endcall);
    endTask.args = endcallArgs || this.results;

    var count = 0;
    var todo = self.tasks.length;
    var cb = function(task, err, data) {
        task.status = DONE;
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
                    var running = stats[RUNNING] || 0;
                    if ((running < limit) && (task.status < RUNNING)) {
                        task.execute();
                    }
                });
            }
        }
        else {
            endTask.fail(err);
        }
    };

    if (this.tasks.length === 0){
        endTask.execute();
        return this;
    }

    this.tasks.forEach(function(task) {
        task.setCallback(function(err, data) {
            cb(task, err, data);
        });
    });

    this.tasks.forEach(function(task) {
        var stats = _.countBy(self.tasks, function(task) {
            return task.status;
        });
        var running = stats[RUNNING] || 0;
        if ((running < limit) && (task.status < RUNNING)) {
            task.execute();
        }
    });

    return this;
};
/*
 Asynk.prototype.getTask = function(id){
 if (_.isString(id)) {
 if (_.) {
 id = this.aliasMap[id];
 }
 }
 return this.tasks[id];
 }*/


module.exports = {
    add: function(fct) { return new Asynk().add(fct); },
    each: function(datas, fct) { return new Asynk().each(datas, fct); },
    callback: new DefArg('callback'),
    data: function(val) {
        if (_.isString(val)) {
            return new DefArg('alias', val);
        }
        else {
            return new DefArg('order', val);
        }
    },
    item: new DefArg('item'),
    fifo: function(){ return new Fifo(); },
    progressive: function(start,step){ return new Progressive(start,step); }
};


