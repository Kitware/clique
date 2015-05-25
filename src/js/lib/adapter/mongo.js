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

            findNode: function (spec, callback) { },

            neighborhood: function (options, callback) { },

            write: function (callback) { }
        };
    };
}(window.clique, window.jQuery, window._));
