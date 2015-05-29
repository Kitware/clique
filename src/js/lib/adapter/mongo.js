(function (clique, $, _) {
    "use strict";

    clique.adapter.Mongo = function (cfg) {
        var host = cfg.host || "localhost",
            db = cfg.database,
            coll = cfg.collection;

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
                var data = {
                    host: host,
                    db: db,
                    coll: coll,
                    spec: JSON.stringify(spec),
                    singleton: JSON.stringify(true)
                };

                $.getJSON("/plugin/mongo/findNodes", data, function (result) {
                    var trec;

                    if (result) {
                        trec = {};
                        trec.key = result._id.$oid;
                        _.each(result.data, function (value, key) {
                            trec[key] = value;
                        });
                    }

                    callback(trec);
                });
            },

            neighborhood: function (options, callback) {
                clique.util.require(options.center, "center");
                clique.util.require(options.radius, "radius");

                options = clique.util.deepCopy(options);
                options.center = JSON.stringify(options.center);
                options = _.extend(options, {
                    host: host,
                    db: db,
                    coll: coll
                });

                $.getJSON("/plugin/mongo/neighborhood", options, callback);
            },

            write: function (callback) { }
        };
    };
}(window.clique, window.jQuery, window._));
