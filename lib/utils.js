module.exports = {
    isUndefined: function (myVal) {
        return myVal === void(0);
    },
    isDefined: function (myVal) {
        return myVal !== void(0);
    },
    isBoolean: function (myVal) {
        return typeof myVal === 'boolean';
    },
    isString: function (myVal) {
        return typeof myVal === 'string';
    },
    isFunction: function (myVal) {
        return typeof myVal === 'function';
    },
    isArray: function (myVal) {
        return this.isDefined(myVal) && Array.isArray(myVal);
    },
    toArray: function (myArray) {
        return Array.prototype.slice.call(myArray);
    },
    countBy: function (inArray, filter) {
        var count = [];
        for (var i in inArray) {
            var resultFilter = filter(inArray[i]);

            if (count[resultFilter]) {
                count[resultFilter]++;
            } else {
                count[resultFilter] = 1;
            }
        }
        ;
        return count;
    }
};