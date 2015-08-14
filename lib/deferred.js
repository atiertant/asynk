var Deferred = function () {
    var PENDING = 0;
    var RESOLVED = 1;
    var REJECTED = 2;
    var _state = PENDING;
    var _resolvedCallbacks = [];
    var _rejectedCallbacks = [];
    var _progressCallbacks = [];
    var _promise = {};

    var _args = null;
    this.always = function () {
        if (_state === PENDING) {
            for (var i in arguments) {
                _resolvedCallbacks.push(arguments[i]);
                _rejectedCallbacks.push(arguments[i]);
            }
        }
        else {
            for (var i in arguments) {
                setTimeout(function() {
                    arguments[i].apply(null, _args);
                },0);
            }
        }
        return this;
    };
    this.done = function () {
        if (_state === PENDING) {
            for (var i in arguments) {
                _resolvedCallbacks.push(arguments[i]);
            }
        }
        if (_state === RESOLVED) {
            var dcs = arguments;
            for (var i in arguments) {
                setTimeout(function() {
                    dcs[i].apply(null, _args);
                },0);    
            }
        }
        return this;
    };
    this.fail = function () {
        if (_state === PENDING) {
            for (var i in arguments) {
                _rejectedCallbacks.push(arguments[i]);
            }
        }
        if (_state === REJECTED) {
            var fcs = arguments;
            for (var i in arguments) {
                setTimeout(function() {
                    fcs[i].apply(null, _args);
                },0);    
            }
        }
        return this;
    };
    this.isRejected = function () {
        return (_state === REJECTED);
    };
    this.isResolved = function () {
        return (_state === RESOLVED);
    };
    this.notify = function () {
        if (_state === PENDING) {
            for (var i in _progressCallbacks) {
                setTimeout(function() {
                    _progressCallbacks[i].apply(null, arguments);
                },0);    
            }
        }
        return this;
    };
    this.notifyWith = function (context, args) {
        if (_state === PENDING) {
            var args = args || [];
            var context = context || {};
            for (var i in _progressCallbacks) {
                setTimeout(function() {
                    _progressCallbacks[i].apply(context, args);
                },0);    
            }
        }
        return this;
    };
    this.pipe = function (doneFilter) {
        var promise = {};
        promise.done = function() {
            var doneCallbacks = [];
            var promisedoneCallbacks = Array.prototype.slice.call(arguments);
            for (var i in promisedoneCallbacks) {
                doneCallbacks.push(function(){
                    var args = doneFilter.apply(null,arguments);
                    return promisedoneCallbacks[i].apply(null, [args]);
                });
            }
            if (_state === PENDING) {
                for (var i in doneCallbacks) {
                    _resolvedCallbacks.push(doneCallbacks[i]);
                }
            }
            if (_state === RESOLVED) {
                for (var i in doneCallbacks) {
                    setTimeout(function() {
                        doneCallbacks[i].apply(null, _args);
                    },0);    
                }
            }
            return this;
        };
        promise.then = this.then;
        promise.fail = this.fail;
        promise.always = this.always;
        promise.pipe = this.pipe;
        promise.progress = this.progress;
        promise.state = this.state;
        promise.promise = this.promise;
        return promise;
    };
    this.progress = function () {
        if (_state === PENDING) {
            for (var i in arguments) {
                _progressCallbacks.push(arguments[i]);
            }
        }
        return this;
    };
    this.promise = function (promisify) {
        var promise = promisify || _promise;
        promise.then = this.then;
        promise.done = this.done;
        promise.fail = this.fail;
        promise.always = this.always;
        promise.pipe = this.pipe;
        promise.progress = this.progress;
        promise.state = this.state;
        promise.promise = this.promise;
        return promise;
    };
    this.reject = function () {
        if (_state === PENDING) {
            _state = REJECTED;
            _args = arguments;
            for (var i in _rejectedCallbacks) {
                setTimeout(function() {
                    _rejectedCallbacks[i].apply(null, _args);
                },0);    
            }
        }
        return this;
    };
    this.rejectWith = function (context, args) {
        if (_state === PENDING) {
            _state = REJECTED;
            _args = args || [];
            var context = context || {};
            for (var i in _rejectedCallbacks) {
                setTimeout(function() {
                    _rejectedCallbacks[i].apply(context, _args);
                },0);    
            }
        }
        return this;
    };
    this.resolve = function () {
        if (_state === PENDING) {
            _state = RESOLVED;
            _args = arguments;
            for (var i in _resolvedCallbacks) {
                setTimeout(function() {
                    _resolvedCallbacks[i].apply(null, _args);
                },0);
            }
        }
        return this;
    };
    this.resolveWith = function (context, args) {
        if (_state === PENDING) {
            _state = RESOLVED;
            _args = args || [];
            var context = context || {};
            for (var i in _resolvedCallbacks) {
                setTimeout(function() {
                    _resolvedCallbacks[i].apply(context, _args);
                },0);
            }
        }
        return this;
    };
    this.state = function () {
        switch (_state) {
            case PENDING:
                return "pending";
            case RESOLVED:
                return "resolved";
            case REJECTED:
                return "rejected";
        }
    };
    this.then = function (doneFilter, failFilter, progressFilter) {
        var promise = {};
        var parent = this;
        promise.then = this.then;
        promise.done = function() {
            var doneCallbacks = [];
            var promisedoneCallbacks = Array.prototype.slice.call(arguments);
            for (var i in promisedoneCallbacks) {
                doneCallbacks.push(function(){
                    var args = doneFilter.apply(null,arguments);
                    return promisedoneCallbacks[i].apply(null, [args]);
                });
            }
            if (_state === PENDING) {
                for (var i in doneCallbacks) {
                    _resolvedCallbacks.push(doneCallbacks[i]);
                }
            }
            if (_state === RESOLVED) {
                for (var i in doneCallbacks) {
                    setTimeout(function() {
                        doneCallbacks[i].apply(null, _args);
                    },0);    
                }
            }
            return this;
        };
        promise.fail = function() {
            if (failFilter) {
                var failCallbacks = [];
                var promisefailCallbacks = Array.prototype.slice.call(arguments);
                for (var i in promisefailCallbacks) {
                    failCallbacks.push(function(){
                        var args = failFilter.apply(null,arguments);
                        return promisefailCallbacks[i].apply(null, [args]);
                    });
                }
                if (_state === PENDING) {
                    for (var i in failCallbacks) {
                        _resolvedCallbacks.push(failCallbacks[i]);
                    }
                }
                if (_state === RESOLVED) {
                    for (var i in failCallbacks) {
                        setTimeout(function() {
                            failCallbacks[i].apply(null, _args);
                        },0);    
                    }
                }
            }
            else {
                parent.fail.aplly(null,arguments);
            }
            return this;
        };
        promise.always = this.always;
        promise.pipe = this.pipe;
        promise.progress = function() {
            if (progressFilter) {
                var progressCallbacks = [];
                var promiseprogressCallbacks = Array.prototype.slice.call(arguments);
                for (var i in promiseprogressCallbacks) {
                    progressCallbacks.push(function(){
                        var args = progressFilter.apply(null,arguments);
                        return promiseprogressCallbacks[i].apply(null, [args]);
                    });
                }
                if (_state === PENDING) {
                    for (var i in progressCallbacks) {
                        _resolvedCallbacks.push(progressCallbacks[i]);
                    }
                }
                if (_state === RESOLVED) {
                    for (var i in progressCallbacks) {
                        setTimeout(function() {
                            progressCallbacks[i].apply(null, _args);
                        },0);    
                    }
                }
            }
            else {
                parent.progress.aplly(null,arguments);
            }
            return this;
        };
        promise.state = this.state;
        promise.promise = this.promise;
        return promise;
    };
    this.when = function () {
        var whenDeferred = new Deferred();
        var count = arguments.length;
        var data = [];
        var objs = arguments;
        for (var i in objs) {
            (function (i) {
                var obj = objs[i];
                //check if object is a promise or a deffered object
                if (obj.then && obj.done && obj.fail && obj.state) {
                    var state = obj.state();
                    switch (state) {
                        case "pending":
                        case "resolved":
                            obj.done(function () {
                                if (arguments.length > 1) {
                                    data[i] = Array.prototype.slice.call(arguments);
                                }
                                else {
                                    data[i] = arguments[0];
                                }
                                count--;
                                if (count <= 0) {
                                    whenDeferred.resolve.apply(whenDeferred, data);
                                }
                            });
                            break;
                        case "rejected":
                            obj.fail(function () {
                                if (arguments.length > 1) {
                                    data[i] = Array.prototype.slice.call(arguments);
                                }
                                else {
                                    data[i] = arguments[0];
                                }
                                whenDeferred.reject.apply(whenDeferred, data);
                            });
                            break;
                    }
                }
                else {
                    //this not a promise so act like a resolved promise
                    data[i] = obj;
                    count--;
                    if (count <= 0) {
                        whenDeferred.resolve.apply(whenDeferred, data);
                    }
                }
            })(i);
        }
        return whenDeferred.promise();
    };
};
module.exports = Deferred;