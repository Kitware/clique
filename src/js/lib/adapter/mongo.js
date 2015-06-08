(function (clique, $, _, Backbone) {
    "use strict";

    clique.adapter.Mongo = function (cfg) {
        var findNodesService = "/plugin/mongo/findNodes",
            mutators = {},
            mongoStore = {
                host: cfg.host || "localhost",
                db: cfg.database,
                coll: cfg.collection
            };

        clique.util.require(cfg.database, "database");
        clique.util.require(cfg.collection, "collection");

        return _.extend({
            findNodes: function (spec, callback) {
                var data = _.extend({
                    spec: JSON.stringify(spec)
                }, mongoStore);

                $.getJSON(findNodesService, data, _.compose(callback, _.partial(_.map, _, _.bind(this.getMutator, this))));
            },

            findNode: function (spec, callback) {
                var data = _.extend({
                    spec: JSON.stringify(spec),
                    singleton: JSON.stringify(true)
                }, mongoStore);

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
                options = _.extend(options, mongoStore);

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

            sync: function (callback) {
                callback();
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
                        $.getJSON("/plugin/mongo/update", _.extend({
                            key: mutator.key(),
                            prop: prop,
                            value: value
                        }, mongoStore));
                    });
                }

                return mutators[key];
            }
        }, Backbone.Events);
    };
}(window.clique, window.jQuery, window._, window.Backbone));
