var utils = require('./lib/utils');
var Deferred = require('./lib/deferred');

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

var Task = function (context, id, fct) {
    this.context = context;
    this.id = id;
    this.alias = null;
    this.fct = fct;
    this.args = [];
    this.dependencies = [];
    this.status = WAITING;
};

Task.prototype.setCallback = function (callback) {
    this.callback = callback;
};

Task.prototype.execute = function () {
    var self = this;
    if (!this.checkDependencies()) {
        this.status = WAITING_FOR_DEPENDENCY;
        return;
    }
    this.status = RUNNING;

    var resolved = [];
    this.args.forEach(function (arg, index) {
        if (arg instanceof DefArg) {
            resolved[index] = arg.resolve(self);
        }
        else {
            resolved[index] = arg;
        }
    });
    if (this.status === RUNNING) {
        this.fct.apply(null, resolved);
    }
};

Task.prototype.reject = function (err) {
    this.status = FAIL;
    this.fct.apply(null, [err, null]);
};

Task.prototype.checkDependencies = function () {
    for (var key in this.dependencies) {
        var id = this.dependencies[key];

        if (utils.isString(id)) {
            var alias = this.context.aliasMap[id];
            if (utils.isUndefined(alias)) {
                throw new Error('Unknown dependancy alias: ' + id);
            }
            if (utils.isArray(alias)) {
                for (var i in alias) {
                    var taskid = alias[i];
                    if (this.context.tasks[taskid].status !== DONE) {
                        return false;
                    }
                }
            }
            else if (this.context.tasks[alias].status !== DONE) {
                return false;
            }
        }
        else if (this.context.tasks[id].status !== DONE) {
            return false;
        }
    }
    return true;
};

/********************************************************************************/
/* Deferred Argument                                                            */
/********************************************************************************/

var DefArg = function (type, val) {
    this.type = type;
    this.value = val;
};

DefArg.prototype.resolve = function (task) {
    switch (this.type) {
        case 'order':
            if (this.value >= 0) {
                if (task.context.tasks[this.value].status !== DONE) {
                    task.status = WAITING_FOR_DEPENDENCY;
                    task.dependencies.push(this.value);
                    return this;
                }
                else {
                    return task.context.results[this.value];
                }
            }
            else if (this.value < 0) {
                if (task.context.tasks[task.id + this.value].status !== DONE) {
                    task.status = WAITING_FOR_DEPENDENCY;
                    task.dependencies.push(task.id + this.value);
                    return this;
                }
                else {
                    return task.context.results[task.id + this.value];
                }
            }
            break;

        case 'alias':
            if (this.value === 'all') {
                return task.context.results;
            }
            else {
                return task.context.results[task.context.aliasMap[this.value]];
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
var Progressive = function (start, step) {
    this.step = step || 1;
    this.last = (utils.isUndefined(start) ? 1 : start) - this.step;
    this.stack = [];
};

Progressive.prototype.push = function (order, fct) {
    var self = this;
    var task = {order: order, fct: fct};
    this.stack.push(task);

    return function () {
        task.args = utils.toArray(arguments);
        var reCheck = true;
        while (reCheck) {
            reCheck = false;
            for (var i in self.stack) {
                var queued = self.stack[i];
                if (queued.order === (self.last + self.step)) {
                    if (!utils.isUndefined(queued.args)) {
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
var Fifo = function () {
    this.stack = [];
};
Fifo.prototype.push = function (fct) {
    var self = this;
    var task = {};
    task.fct = fct;
    this.stack.push(task);
    return function () {
        task.args = utils.toArray(arguments);
        if (self.stack[0] === task) {
            while (self.stack.length && !utils.isUndefined(self.stack[0].args)) {
                var callback = self.stack.shift();
                callback.fct.apply(null, callback.args);
            }
        }
    };
};

/********************************************************************************/
/* Asynk                                                                        */
/********************************************************************************/

var Asynk = function () {

    var after = {
        loop: function (condition) {
            if (!utils.isFunction(condition)) {
                throw new Error('Asynk loop function require a function as first argument');
            }
            _Context.loopDefer = _Context.loopDefer || new Deferred();
            _Context.loopResults = _Context.loopResults || [];
            this.done(function () {
                var result = utils.toArray(arguments);
                if (result.length > 1) {

                    _Context.loopResults.push(result);
                }
                else {
                    _Context.loopResults.push(result[0]);
                }

                if (condition.apply(null, result)) {
                    //reset values
                    for (var i in _Context.tasks) {
                        _Context.tasks[i].status = WAITING;
                    }
                    _Context.results = [];
                    _Context.currentTasks = [];
                    _Context.exec.fct.apply(null, _Context.exec.args).loop(condition);
                }
                else {
                    _Context.loopDefer.resolve(_Context.loopResults);
                }
            });
            this.fail(_Context.loopDefer.reject);
            return _Context.loopDefer.promise();
        },
        asyncLoop: function (condition) {
            if (!utils.isFunction(condition)) {
                throw new Error('Asynk loop function require a function as first argument');
            }
            _Context.loopDefer = _Context.loopDefer || new Deferred();
            _Context.loopResults = _Context.loopResults || [];
            this.done(function () {
                var result;
                if (arguments.length > 1) {
                    result = utils.toArray(arguments);
                }
                else {
                    result = arguments[0];
                }
                _Context.loopResults.push(result);
                
                condition.apply(null, [result, function (err, loop) {
                    if (err) {
                        return _Context.loopDefer.reject(err);
                    }
                    if (loop) {
                        //reset values
                        for (var i in _Context.tasks) {
                            _Context.tasks[i].status = WAITING;
                        }
                        _Context.results = [];
                        _Context.currentTasks = [];
                        _Context.exec.fct.apply(null, _Context.exec.args).asyncLoop(condition);
                    }
                    else {
                        _Context.loopDefer.resolve(_Context.loopResults);
                    }
                }]);
            });
            this.fail(_Context.loopDefer.reject);
            return _Context.loopDefer.promise();
        }
    };

    var Asynk = {};

    var _Context = {
        tasks: [],
        aliasMap: {},
        results: [],
        currentTasks: Asynk.currentTasks
    };

    Asynk.add = function (fct) {
        if (utils.isUndefined(fct) || !utils.isFunction(fct)) {
            throw new Error('Asynk add require a function as argument');
        }
        var newId = _Context.tasks.length;
        _Context.tasks[newId] = new Task(_Context, newId, fct);
        _Context.currentTasks = [newId];
        this.args(new DefArg('callback'));
        return this;
    };

    Asynk.each = function (datas, fct) {
        if (utils.isUndefined(fct) || !utils.isFunction(fct)) {
            throw new Error('Asynk each require a function as second argument');
        }
        _Context.currentTasks = [];
        datas.forEach(function (data) {
            var newId = _Context.tasks.length;
            _Context.tasks[newId] = new Task(_Context, newId, fct);
            _Context.tasks[newId].item = data;
            _Context.currentTasks.push(newId);
        });
        this.args(new DefArg('item'), new DefArg('callback'));
        return this;
    };

    Asynk.args = function () {
        args = utils.toArray(arguments);
        _Context.currentTasks.forEach(function(currentTask) {
            _Context.tasks[currentTask].args = utils.toArray(args);
        });
        return this;
    };

    Asynk.require = function (dependency) {
        _Context.currentTasks.forEach(function(currentTask) {
            var current = _Context.tasks[currentTask];
            current.dependencies.push(dependency);
        });
        return this;
    };

    Asynk.alias = function (alias) {
        if (utils.isString(alias)) {
            _Context.currentTasks.forEach(function (currentTask, index) {
                _Context.tasks[currentTask].alias = alias;
            });
            if (_Context.currentTasks.length > 1) {
                _Context.aliasMap[alias] = _Context.currentTasks;
            }
            else {
                _Context.aliasMap[alias] = _Context.currentTasks[0];
            }
        }
        return this;
    };

    Asynk.serie = function(endcallArgs) {
        _Context.exec = {
            fct: Asynk.serie,
            args: [endcallArgs]
        };
        var defer = new Deferred();
        var endTask = new Task(_Context, 'end', defer.resolve.bind(defer));
        endTask.args = endcallArgs || [new DefArg('alias', 'all')];
        var currentId = 0;

        var cb = function (err, data) {
            if (err) {
                _Context.tasks[currentId].status = FAIL;
                defer.reject(err);
                endTask.reject(err);
                return;
            }
            _Context.tasks[currentId].status = DONE;
            _Context.results.push(data);
            currentId++;
            next();
        };
        var next = function() {
            var current = _Context.tasks[currentId];
            if (current) {
                current.setCallback(cb);
                current.execute();
                if (current.status === WAITING_FOR_DEPENDENCY) {
                    defer.reject(new Error('could not resolve this dependancies'));
                }
            }
            else {
                endTask.execute();
            }
        };
        next();
        return defer.promise(after);
    };

    Asynk.parallel = function(endcallArgs) {
        _Context.exec = {
            fct: Asynk.parallel,
            args: [endcallArgs]
        };
        var defer = new Deferred();
        var endTask = new Task(_Context, 'end', defer.resolve.bind(defer));
        endTask.args = endcallArgs || [new DefArg('alias', 'all')];

        var count = 0;
        var todo = _Context.tasks.length;
        var cb = function (task, err, data) {
            task.status = DONE;
            if (err) {
                defer.reject(err);
                endTask.reject(err);
                return;
            }
            _Context.results[task.id] = data;
            count++;
            if (count >= todo) {
                endTask.execute();
            }
            else {
                _Context.tasks.forEach(function(task) {
                    if (task.status === WAITING_FOR_DEPENDENCY) {
                        task.execute();
                    }
                });
            }
        };

        if (_Context.tasks.length === 0) {
            endTask.execute();
            return defer.promise();
        }

        _Context.tasks.forEach(function(task) {
            task.setCallback(function (err, data) {
                cb(task, err, data);
            });
        });

        _Context.tasks.forEach(function(task) {
            task.execute();
        });

        return defer.promise(after);
    };

    Asynk.parallelLimited = function(limit, endcallArgs) {
        _Context.exec = {
            fct: Asynk.parallelLimited,
            args: [limit, endcallArgs]
        };
        var defer = new Deferred();
        var endTask = new Task(_Context, 'end', defer.resolve.bind(defer));
        endTask.args = endcallArgs || [new DefArg('alias', 'all')];

        var count = 0;
        var todo = _Context.tasks.length;
        var cb = function (task, err, data) {
            task.status = DONE;
            if (err) {
                defer.reject(err);
                endTask.reject(err);
                return;
            }
            _Context.results[task.id] = data;
            count++;
            if (count >= todo) {
                endTask.execute();
            }
            else {
                _Context.tasks.forEach(function(task) {
                    var stats = utils.countBy(_Context.tasks, function(task) {
                        return task.status;
                    });
                    var running = stats[RUNNING] || 0;
                    if ((running < limit) && (task.status < RUNNING)) {
                        task.execute();
                    }
                });
            }
        };

        if (_Context.tasks.length === 0) {
            endTask.execute();
            return defer.promise();
        }

        _Context.tasks.forEach(function(task) {
            task.setCallback(function (err, data) {
                cb(task, err, data);
            });
        });

        _Context.tasks.forEach(function(task) {
            var stats = utils.countBy(_Context.tasks, function(task) {
                return task.status;
            });
            var running = stats[RUNNING] || 0;
            if ((running < limit) && (task.status < RUNNING)) {
                task.execute();
            }
        });

        return defer.promise(after);
    };

    return Asynk;
};

module.exports = {
    add: function(fct) {
        return Asynk().add(fct);
    },
    each: function(datas, fct) {
        return Asynk().each(datas, fct);
    },
    callback: new DefArg('callback'),
    data: function(val) {
        if (utils.isString(val)) {
            return new DefArg('alias', val);
        }
        else {
            return new DefArg('order', val);
        }
    },
    item: new DefArg('item'),
    fifo: function () {
        return new Fifo();
    },
    progressive: function(start, step) {
        return new Progressive(start, step);
    },
    deferred: function() {
        return new Deferred();
    },
    when: new Deferred().when
};