(function (clique, $, _, Backbone, tangelo) {
    "use strict";

    // Ensure existence of mongo plugin.
    tangelo.getPlugin("mongo");

    tangelo.plugin.mongo.Mongo = clique.Adapter.extend({
        initialize: function (cfg) {
            this.mongoStore = {
                host: cfg.host || "localhost",
                db: cfg.database,
                coll: cfg.collection
            };
        },

        findNodesImpl: function (spec) {
            var data = _.extend({
                spec: JSON.stringify(spec)
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/findNodes2", data).then(function (responses) {
                return _.map(responses, function (response) {
                    var result = {};

                    delete response.type;

                    _.each(response, function (value, key) {
                        if (key === "_id") {
                            result.key = value.$oid;
                        } else {
                            result[key] = value;
                        }
                    });

                    return result;
                });
            });
        },

        findLinksImpl: function (spec, source, target, undirected, directed) {
            var data;

            data = _.extend({
                spec: JSON.stringify(spec),
                source: source,
                target: target,
                undirected: undirected,
                directed: directed
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/findLinks2", data).then(function (responses) {
                return _.map(responses, function (response) {
                    var result = {};

                    _.each(response, function (value, key) {
                        if (key === "_id") {
                            result.key = value.$oid;
                        } else if (key === "source" || key === "target") {
                            result[key] = value.$oid;
                        } else {
                            result[key] = value;
                        }
                    });

                    return result;
                });
            });
        },

        createNodeImpl: function (_data) {
            var data;

            data  = _.extend({
                data: _data ? JSON.stringify(_data) : "{}"
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/createNode", data).then(function (result) {
                var node = {};

                _.each(result, function (value, key) {
                    if (key === "_id") {
                        node.key = value.$oid;
                    } else {
                        node[key] = value;
                    }
                });

                return node;
            });
        },

        createLinkImpl: function (_data) {
            var data;

            data = _.extend({
                source: source,
                target: target,
                data: _data ? JSON.stringify(_data) : "{}"
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/createLink", data).then(function (result) {
                var link = {};

                _.each(result, function (value, key) {
                    if (key === "_id") {
                        link.key = value.$oid;
                    } else if (key === "source" || key === "target") {
                        link[key] = value.$oid;
                    } else {
                        link[key] = value;
                    }
                });

                return link;
            });
        },

        destroyNodeImpl: function (key) {
            var data;

            data = _.extend({
                key: key
            }, this.mongoStore);

            return $.get("plugin/mongo/destroyNode", data);
        },

        destroyLinkImpl: function (key) {
            var data;

            data = _.extend({
                key: key
            }, this.mongoStore);

            return $.get("plugin/mongo/destroyLink", data);
        }
    });

    tangelo.plugin.mongo.Mongo2 = function (cfg) {
        var findNodesService = "plugin/mongo/findNodes",
            mutators = {},
            mongoStore = {
                host: cfg.host || "localhost",
                db: cfg.database,
                coll: cfg.collection
            },
            addMutator,
            translateSpec;

        clique.util.require(cfg.database, "database");
        clique.util.require(cfg.collection, "collection");

        translateSpec = function (spec) {
            var result = {},
                value;

            if (_.isString(spec) || _.isFunction(spec) || _.isNumber(spec)) {
                throw new Error("Type error: 'spec' must be an object");
            }

            if (_.has(spec, "queryOp")) {
                // If this is a "leaf node", translate it to a direct comparison
                // query and return.
                switch (spec.queryOp) {
                case "==": {
                    value = spec.value;
                    break;
                }

                case "!=":
                case ">":
                case ">=":
                case "<":
                case "<=":
                case "~~":
                case "|~":
                case "~|": {
                    throw new Error("unimplemented");
                    break;
                }

                default: {
                    throw new Error("illegal value for queryOp: " + spec.queryOp);
                    break;
                }
                }

                if (spec.field === "key") {
                    result["_id"] = {
                        $oid: value
                    };
                } else {
                    result["data." + spec.field] = value;
                }
            } else if (_.has(spec, "logicOp")) {
                // Otherwise, create a logic operator node and recurse down the
                // operands.
                result["$" + spec.logicOp] = [translateSpec(spec.left), translateSpec(spec.right)];
            } else {
                throw new Error("Type error: 'spec' does not have the right structure");
            }

            return result;
        };

        addMutator = function (mongoRec) {
            var target,
                mutator,
                key,
                type,
                source,
                targetNode;

            key = mongoRec._id.$oid;
            type = mongoRec.type;

            if (!_.has(mutators, key)) {
                target = {
                    key: key,
                    data: mongoRec.data || {}
                };

                if (type === "link") {
                    source = mongoRec.source;
                    if (_.isObject(source)) {
                        source = source.$oid;
                    }

                    target.source = source;

                    targetNode = mongoRec.target;
                    if (_.isObject(targetNode)) {
                        targetNode = targetNode.$oid;
                    }

                    target.target = targetNode;
                }

                mutator = new clique.util.Mutator(target);

                this.listenTo(mutator, "changed", function (mutator, prop, value) {
                    $.getJSON("plugin/mongo/update", _.extend({
                        key: mutator.key(),
                        prop: prop,
                        value: JSON.stringify(value)
                    }, mongoStore));
                });

                this.listenTo(mutator, "cleared", function (mutator, prop) {
                    $.getJSON("plugin/mongo/clear", _.extend({
                        key: mutator.key(),
                        prop: prop
                    }, mongoStore)).then(_.bind(function () {
                        this.trigger("cleared:" + mutator.key(), mutator, prop);
                    }, this));
                });

                mutators[key] = mutator;
            }

            return mutators[key];
        };

        return _.extend({
            findNodes: function (spec) {
                var targets,
                    data;

                data = _.extend({
                    spec: JSON.stringify(translateSpec(spec))
                }, mongoStore);

                return $.getJSON(findNodesService, data)
                    .then(_.partial(_.map, _, _.bind(function (r) {
                        return _.bind(addMutator, this)(r);
                    }, this)));
            },

            findNode: function (spec) {
                var data = _.extend({
                    spec: JSON.stringify(translateSpec(spec)),
                    singleton: JSON.stringify(true)
                }, mongoStore);

                return $.getJSON(findNodesService, data)
                    .then(_.bind(function (result) {
                        var def = new $.Deferred(),
                            target;

                        if (result) {
                            result = _.bind(addMutator, this)(result);
                        }

                        def.resolve(result);
                        return def;
                    }, this));
            },

            findNodeByKey: function (key) {
                return this.findNode({
                    queryOp: "==",
                    field: "key",
                    value: key
                });
            },

            findLinks: function (spec) {
                var data = _.extend({
                    spec: JSON.stringify(spec),
                    singleton: JSON.stringify(false)
                }, mongoStore);

                return $.getJSON("plugin/mongo/findLinks", data)
                    .then(_.partial(_.map, _, addMutator, this));
            },

            findLink: function (spec) {
                var data = _.extend({
                    spec: JSON.stringify(spec),
                    singleton: JSON.stringify(true)
                }, mongoStore);

                return $.getJSON("plugin/mongo/findLinks", data)
                    .then(_.bind(function (result) {
                        var def = new $.Deferred();

                        if (result) {
                            result = _.bind(addMutator, this)(result);
                        }

                        def.resolve(result);
                        return def;
                    }, this));
            },

            newNode: function (metadata) {
                var data = _.extend({
                    data: metadata ? JSON.stringify(metadata) : "{}"
                }, mongoStore);
                return $.getJSON("plugin/mongo/newNode", data)
                    .then(_.bind(addMutator, this));
            },

            newLink: function (source, target, metadata) {
                var data = _.extend({
                    source: source,
                    target: target,
                    data: metadata ? JSON.stringify(metadata) : "{}"
                }, mongoStore);

                return $.getJSON("plugin/mongo/newLink", data)
                    .then(_.bind(addMutator, this));
            },

            destroyNode: function (key) {
                var data = _.extend({
                    key: key
                }, mongoStore);
                return $.get("plugin/mongo/destroyNode", data);
            },

            destroyLink: function (key) {
                var data = _.extend({
                    key: key
                }, mongoStore);
                return $.get("plugin/mongo/destroyLink", data);
            },

            neighborhood: function (options) {
                clique.util.require(options.center, "center");
                clique.util.require(options.radius, "radius");

                options = _.clone(options);
                options.center = options.center.key();
                options = _.extend(options, mongoStore);

                return $.getJSON("plugin/mongo/neighborhood", options)
                    .then(_.bind(function (results) {
                        _.each(results.nodes, addMutator, this);
                        _.each(results.links, addMutator, this);

                        return results;
                    }, this))
                    .then(_.bind(function (results) {
                       var def = new $.Deferred();

                       _.each(results.nodes, _.bind(function (node, i) {
                            var mut = this.getMutator(node._id.$oid);

                            if (mut.key() === options.center) {
                                mut.setTransient("root", true);
                            }

                            results.nodes[i] = mut.getTarget();
                        }, this));

                       _.each(results.links, _.bind(function (link, i) {
                           var mut = this.getMutator(link._id.$oid);
                           results.links[i] = mut.getTarget();
                       }, this));

                       def.resolve(results);
                       return def;
                   }, this));
            },

            sync: function () {
                var def = new $.Deferred();
                def.resolve();
                return def;
            },

            getMutator: _.propertyOf(mutators)
        }, Backbone.Events);
    };
}(window.clique, window.jQuery, window._, window.Backbone, window.tangelo));
