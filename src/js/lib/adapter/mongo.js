(function (clique, $, _, Backbone) {
    "use strict";

    clique.adapter.Mongo = function (cfg) {
        var host = cfg.host || "localhost",
            db = cfg.database,
            coll = cfg.collection,
            findNodesService = "/plugin/mongo/findNodes",
            mutators = {};

        clique.util.require(cfg.database, "database");
        clique.util.require(cfg.collection, "collection");

        return _.extend({
            findNodes: function (spec, callback) {
                var data = {
                    host: host,
                    db: db,
                    coll: coll,
                    spec: JSON.stringify(spec)
                };

                $.getJSON(findNodesService, data, _.compose(callback, _.partial(_.map, _, _.bind(this.getMutator, this))));
            },

            findNode: function (spec, callback) {
                var data = {
                    host: host,
                    db: db,
                    coll: coll,
                    spec: JSON.stringify(spec),
                    singleton: JSON.stringify(true)
                };

                $.getJSON(findNodesService, data, _.bind(function (result) {
                    if (result) {
                        result = this.getMutator(result);
                    }

                    callback(result);
                }, this));
            },

            neighborhood: function (options, callback) {
                clique.util.require(options.center, "center");
                clique.util.require(options.radius, "radius");

                options = _.clone(options);
                options.center = options.center.key();
                options = _.extend(options, {
                    host: host,
                    db: db,
                    coll: coll
                });

                $.getJSON("/plugin/mongo/neighborhood", options, _.bind(function (results) {
                    _.each(results.nodes, _.bind(function (node, i) {
                        var mut = this.getMutator(node);

                        if (mut.key() === options.center) {
                            mut.setTransient("root", true);
                        }

                        results.nodes[i] = mut.getTarget();
                    }, this));

                    callback(results);
                }, this));
            },

            write: function (callback) {
                console.log(callback);
            },

            getMutator: function (mongoRec) {
                var key = mongoRec._id.$oid;

                if (!_.has(mutators, key)) {
                    mutators[key] = new clique.util.Mutator({
                        target: {
                            key: key,
                            data: mongoRec.data
                        }
                    });

                    this.listenTo(mutators[key], "changed", function (mutator, prop, value) {
                        console.log("mutator for " + mutator.key() + ": " + prop + " -> " + value);
                    });
                }

                return mutators[key];
            }
        }, Backbone.Events);
    };
}(window.clique, window.jQuery, window._, window.Backbone));
