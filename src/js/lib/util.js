(function (clique, Hashes, _, Backbone) {
    "use strict";

    clique.util = {};

    clique.util.md5 = (function () {
        var md5 = new Hashes.MD5();

        return function (s) {
            return md5.hex(s);
        };
    }());

    clique.util.linkHash = function (link) {
        var source,
            target;

        source = link.source;
        if (!_.isString(source)) {
            source = source.key;
        }

        target = link.target;
        if (!_.isString(target)) {
            target = target.key;
        }

        return JSON.stringify([source, target]);
    };

    clique.util.deepCopy = function (o) {
        if (_.isUndefined(o)) {
            return undefined;
        }
        return JSON.parse(JSON.stringify(o));
    };

    clique.util.concat = function () {
        var lists = _.toArray(arguments);
        return _.reduce(lists, function (a, b) {
            return a.concat(b);
        }, []);
    };

    clique.util.jqSequence = function (reqs) {
        var helper,
            chain;

        helper = function (reqs, accum, i) {
            if (i === _.size(reqs)) {
                return accum;
            } else {
                accum = accum.then(function () {
                    return reqs[i];
                });

                return helper(reqs, accum, i+1);
            }
        };

        chain = Backbone.$.Deferred();
        chain.resolve();

        return helper(reqs, chain, 0);
    };

    clique.util.Set = function () {
        var items = {};

        return {
            add: function (item) {
                items[item] = null;
            },

            remove: function (item) {
                delete items[item];
            },

            has: function (item) {
                return _.has(items, item);
            },

            items: function (mapper) {
                var stuff = _.keys(items);
                if (mapper) {
                    stuff = _.map(stuff, mapper);
                }
                return stuff;
            },

            size: function () {
                return _.size(items);
            }
        };
    };

    clique.util.MultiTable = function () {
        var table = {};

        return {
            add: function (key, item) {
                if (!_.has(table, key)) {
                    table[key] = new clique.util.Set();
                }

                table[key].add(item);
            },

            remove: function (key, item) {
                if (_.has(table, key)) {
                    table[key].remove(item);
                }
            },

            strike: function (key) {
                delete table[key];
            },

            has: function (key, item) {
                return _.has(table, key) && (_.isUndefined(item) || table[key].has(item));
            },

            items: function (key) {
                if (_.has(table, key)) {
                    return table[key].items();
                }
            }
        };
    };

    clique.util.require = function (arg, name) {
        if (_.isUndefined(arg)) {
            throw new Error("argument '" + name + "' is required");
        }
    };

    clique.util.Accessor = function (raw) {
        var disallowed = new clique.util.Set();

        raw.data = raw.data || {};

        _.each(["key", "source", "target", "data"], function (d) {
            disallowed.add(d);
        });

        return _.extend({
            key: function () {
                return raw.key;
            },

            source: function () {
                return raw.source.key || raw.source;
            },

            target: function () {
                return raw.target.key || raw.target;
            },

            getAttribute: function (prop) {
                if (disallowed.has(prop)) {
                    return;
                }
                return raw[prop];
            },

            setAttribute: function (prop, value) {
                if (disallowed.has(prop)) {
                    return false;
                }

                raw[prop] = value;
                return true;
            },

            clearAttribute: function (prop) {
                if (disallowed.has(prop)) {
                    return false;
                }

                delete raw[prop];
                return true;
            },

            getAllAttributes: function () {
                var result = {};

                _.each(raw, function (value, key) {
                    if (!disallowed.has(key)) {
                        result[key] = value;
                    }
                });

                return result;
            },

            getData: function (prop) {
                return raw.data[prop];
            },

            setData: function (prop, value) {
                raw.data[prop] = value;
                this.trigger("changed", this, prop, value);
            },

            clearData: function (prop) {
                delete raw.data[prop];
                this.trigger("cleared", this, prop);
            },

            getAllData: function () {
                var result = {};

                _.each(raw.data, function (value, key) {
                    result[key] = value;
                });

                return result;
            },

            getRaw: function () {
                return raw;
            }
        }, Backbone.Events);
    };
}(window.clique, window.Hashes, window._, window.Backbone));
