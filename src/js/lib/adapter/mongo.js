(function (clique, $, _, Backbone) {
    "use strict";

    clique.adapter.Mongo = function (cfg) {
        var host = cfg.host || "localhost",
            db = cfg.database,
            coll = cfg.collection,
            findNodesService = "/plugin/mongo/findNodes",
            getMutator,
            mutators = {};

        clique.util.require(cfg.database, "database");
        clique.util.require(cfg.collection, "collection");

        getMutator = _.bind(function (mongoRec, that) {
            var key = mongoRec._id.$oid;

            if (!_.has(mutators, key)) {
                mutators[key] = new clique.util.Mutator({
                    target: {
                        key: key,
                        data: mongoRec.data
                    }
                });

                that.listenTo(mutators[key], "changed", function (mutator, prop, value) {
                    console.log("mutator for " + mutator.key() + ": " + prop + " -> " + value);
                });
            }

            return mutators[key];
        }, this);

        return _.extend({
            findNodes: function (spec, callback) {
                var data = {
                    host: host,
                    db: db,
                    coll: coll,
                    spec: JSON.stringify(spec)
                };

                $.getJSON(findNodesService, data, _.compose(callback, _.map, _.partial(getMutator, _, this)));
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
                        result = getMutator(result, this);
                    }

                    callback(result);
                }, this));
            },

            neighborhood: function (options, callback) {
                var initialFrontier,
                    neighbor = {
                        nodes: new clique.util.Set(),
                        links: new clique.util.Set()
                    },
                    core;

                clique.util.require(options.center, "center");
                clique.util.require(options.radius, "radius");

                options.center.setTransient("root", true);

                initialFrontier = new clique.util.Set();

                // Don't start the process with a "deleted" node (unless deleted
                // nodes are specifically allowed).
                if (options.deleted || !options.center.getData("deleted")) {
                    neighbor.nodes.add(options.center.key());
                    initialFrontier.add(options.center.key());
                }

                // Fan out from the center node to the requested radius.
                core = _.bind(function (frontier, radius) {
                    var newFrontier = new clique.util.Set(),
                        items = frontier.items(),
                        deferred = [];

                    _.each(items, function (nodeKey) {
                        var data;

                        // Get the neighboring nodes of this node.
                        data = {
                            host: host,
                            db: db,
                            coll: coll,
                            start: nodeKey,
                            deleted: options.deleted || false
                        };
                        deferred.push($.getJSON("/plugin/mongo/neighbors", data));
                    });

                    $.when.apply($, deferred).done(_.bind(function () {
                        if (radius === 0) {
                            var conclude = _.after(neighbor.nodes.size(), function () {
                                var blah = {
                                    nodes: neighbor.nodeData,
                                    links: _.map(neighbor.links.items(), function (link) {
                                        link = JSON.parse(link);

                                        return {
                                            source: link[0],
                                            target: link[1]
                                        };
                                    })
                                };
                                callback(blah);
                            });

                            neighbor.nodeData = [];

                            _.each(neighbor.nodes.items(), _.bind(function (node, i) {
                                this.findNode({
                                    key: node
                                }, function (data) {
                                    neighbor.nodeData[i] = data.getTarget();
                                    conclude();
                                });
                            }, this));
                        } else {
                            _.each(Array.prototype.slice.call(arguments), function (neighbors, i) {
                                var me = items[i];

                                _.each(neighbors.incoming, function (n) {
                                    neighbor.links.add(JSON.stringify([n, me]));
                                    if (!neighbor.nodes.has(n)) {
                                        newFrontier.add(n);
                                    }
                                    neighbor.nodes.add(n);
                                });

                                _.each(neighbors.outgoing, function (n) {
                                    neighbor.links.add(JSON.stringify([me, n]));
                                    if (!neighbor.nodes.has(n)) {
                                        newFrontier.add(n);
                                    }
                                    neighbor.nodes.add(n);
                                });
                            });

                            core(newFrontier, radius - 1);
                        }
                    }, this));
                }, this);

                core(initialFrontier, options.radius);
            },

            write: function (callback) {
                console.log(callback);
            }
        }, Backbone.Events);
    };
}(window.clique, window.jQuery, window._, window.Backbone));
