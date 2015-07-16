(function (clique, $, _, Backbone, tangelo) {
    "use strict";

    tangelo.getPlugin("mongo").Mongo = function (cfg) {
        var findNodesService = "plugin/mongo/findNodes",
            mutators = {},
            mongoStore = {
                host: cfg.host || "localhost",
                db: cfg.database,
                coll: cfg.collection
            };

        clique.util.require(cfg.database, "database");
        clique.util.require(cfg.collection, "collection");

        return _.extend({
            findNodes: function (spec) {
                var data = _.extend({
                    spec: JSON.stringify(spec)
                }, mongoStore);

                return $.getJSON(findNodesService, data)
                   .then(_.partial(_.map, _, _.bind(this.getMutator, this)));
            },

            findNode: function (spec) {
                var data = _.extend({
                    spec: JSON.stringify(spec),
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
                    mutators[key] = new clique.util.Mutator({
                        target: {
                            key: key,
                            data: mongoRec.data
                        }
                    });

                    this.listenTo(mutators[key], "changed", function (mutator, prop, value) {
                        $.getJSON("plugin/mongo/update", _.extend({
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
}(window.clique, window.jQuery, window._, window.Backbone, window.tangelo));
