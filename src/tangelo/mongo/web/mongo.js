(function (clique, $, _, Backbone, tangelo) {
    "use strict";

    tangelo.getPlugin("mongo").Mongo = function (cfg) {
        var findNodesService = "plugin/mongo/findNodes",
            mutators = {},
            mongoStore = {
                host: cfg.host || "localhost",
                db: cfg.database,
                coll: cfg.collection
            },
            translateSpec;

        clique.util.require(cfg.database, "database");
        clique.util.require(cfg.collection, "collection");

        translateSpec = function (spec) {
            var result = {},
                value;

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
            }

            return result;
        };

        return _.extend({
            findNodes: function (spec) {
                var data = _.extend({
                    spec: JSON.stringify(translateSpec(spec))
                }, mongoStore);

                return $.getJSON(findNodesService, data)
                   .then(_.partial(_.map, _, _.bind(this.getMutator, this)));
            },

            findNode: function (spec) {
                var data = _.extend({
                    spec: JSON.stringify(translateSpec(spec)),
                    singleton: JSON.stringify(true)
                }, mongoStore);

                return $.getJSON(findNodesService, data)
                    .then(_.bind(function (result) {
                        var def = new $.Deferred();

                        if (result) {
                            result = this.getMutator(result);
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
                    .then(_.bind(function (results) {
                        var def = new $.Deferred();

                        def.resolve(_.map(results, this.getMutator, this));
                        return def;
                    }, this));
            },

            findLink: function (spec) {
                var data = _.extend({
                    spec: JSON.stringify(spec),
                    singleton: JSON.stringify(true)
                }, mongoStore);

                return $.getJSON("plugin/mongo/findLinks", data)
                    .then(_.bind(function (result) {
                        var def = new $.Deferred();

                        def.resolve(result && this.getMutator(result));
                        return def;
                    }, this));
            },

            newNode: function (metadata) {
                var data = _.extend({
                    data: metadata ? JSON.stringify(metadata) : "{}"
                }, mongoStore);
                return $.getJSON("plugin/mongo/newNode", data);
            },

            newLink: function (source, target, metadata) {
                var data = _.extend({
                    source: source,
                    target: target,
                    data: metadata ? JSON.stringify(metadata) : "{}"
                }, mongoStore);

                return $.getJSON("plugin/mongo/newLink", data);
            },

            destroyNode: function (key) {
                var data = _.extend({
                    key: key
                }, mongoStore);
                return $.getJSON("plugin/mongo/destroyNode", data);
            },

            neighborhood: function (options) {
                clique.util.require(options.center, "center");
                clique.util.require(options.radius, "radius");

                options = _.clone(options);
                options.center = options.center.key();
                options = _.extend(options, mongoStore);

                return $.getJSON("plugin/mongo/neighborhood", options)
                   .then(_.bind(function (results) {
                       var def = new $.Deferred();

                       _.each(results.nodes, _.bind(function (node, i) {
                            var mut = this.getMutator(node);

                            if (mut.key() === options.center) {
                                mut.setTransient("root", true);
                            }

                            results.nodes[i] = mut.getTarget();
                        }, this));

                       _.each(results.links, _.bind(function (link, i) {
                           var mut = this.getMutator(link);
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

            getMutator: function (mongoRec) {
                var key = mongoRec._id.$oid;

                if (!_.has(mutators, key)) {
                    var target = {
                        key: key,
                        data: mongoRec.data
                    };

                    if (mongoRec.source) {
                        target.source = mongoRec.source;
                    }

                    if (mongoRec.target) {
                        target.target = mongoRec.target;
                    }

                    mutators[key] = new clique.util.Mutator({
                        target: target
                    });

                    this.listenTo(mutators[key], "changed", function (mutator, prop, value) {
                        $.getJSON("plugin/mongo/update", _.extend({
                            key: mutator.key(),
                            prop: prop,
                            value: JSON.stringify(value)
                        }, mongoStore));
                    });

                    this.listenTo(mutators[key], "cleared", function (mutator, prop) {
                        $.getJSON("plugin/mongo/clear", _.extend({
                            key: mutator.key(),
                            prop: prop
                        }, mongoStore)).then(_.bind(function () {
                            this.trigger("cleared:" + mutator.key(), mutator, prop);
                        }, this));
                    });
                }

                return mutators[key];
            }
        }, Backbone.Events);
    };
}(window.clique, window.jQuery, window._, window.Backbone, window.tangelo));
