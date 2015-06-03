(function (clique, $, _) {
    "use strict";

    clique.adapter.Mongo = function (cfg) {
        var host = cfg.host || "localhost",
            db = cfg.database,
            coll = cfg.collection,
            mutators = {};

        clique.util.require(cfg.database, "database");
        clique.util.require(cfg.collection, "collection");

        return {
            findNodes: function (spec, callback) {
                var data = {
                    host: host,
                    db: db,
                    coll: coll,
                    spec: JSON.stringify(spec)
                };

                $.getJSON("/plugin/mongo/findNodes", data, function (results) {
                    var transformedResults = _.map(results, function (rec) {
                        var trec = {};
                        trec.key = rec._id.$oid;
                        _.each(rec.data, function (value, key) {
                            trec[key] = value;
                        });

                        return trec;
                    });

                    callback(transformedResults);
                });
            },

            findNode: function (spec, callback) {
                var data,
                    service = "/plugin/mongo/findNodes",
                    key,
                    mut;

                if (_.has(spec, "key")) {
                    if (_.has(mutators, spec.key)) {
                        // The spec mentions a key, and we already have a
                        // mutator for that key - just make sure the mutator
                        // matches the rest of the spec, and react accordingly.
                        mut = mutators[spec.key];
                        callback(mut.matches(spec) ? mut : undefined);
                    } else {
                        data = {
                            host: host,
                            db: db,
                            coll: coll,
                            spec: JSON.stringify(spec),
                            singleton: JSON.stringify(true)
                        };

                        $.getJSON(service, data, function (result) {
                            var key,
                                rec;

                            if (result) {
                                key = result._id.$oid;

                                rec = {
                                    key: key,
                                    data: result.data
                                };

                                result = mutators[key] = new clique.util.Mutator({
                                    target: rec
                                });
                            }

                            callback(result);
                        });
                    }
                } else {
                    // First look through the mutators for a matching record.
                    key = _.findKey(mutators, function (m) {
                        return m.matches(spec);
                    });

                    if (key) {
                        callback(mutators[key]);
                    } else {
                        // Now go to the database to see if a record can be
                        // found there.
                        data = {
                            host: host,
                            db: db,
                            coll: coll,
                            spec: JSON.stringify(spec),
                            singleton: JSON.stringify(true)
                        };

                        $.getJSON(service, data, function (result) {
                            var key,
                                rec;

                            if (result) {
                                key = result._id.$oid;

                                rec = {
                                    key: key,
                                    data: result.data
                                };

                                result = mutators[key] = new clique.util.Mutator({
                                    target: rec
                                });
                            }

                            callback(result);
                        });
                    }
                }
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
        };
    };
}(window.clique, window.jQuery, window._));
