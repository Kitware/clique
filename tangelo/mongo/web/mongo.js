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

            return $.getJSON("plugin/mongo/findNodes", data).then(function (responses) {
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

            return $.getJSON("plugin/mongo/findLinks", data).then(function (responses) {
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

        neighborhoodImpl: function (node, radius) {
            var data = _.extend({
                start_key: node.key(),
                radius: radius
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/neighborhood", data);
        },

        createLinkImpl: function (source, target, _data, undirected) {
            var data;

            data = _.extend({
                source: source,
                target: target,
                data: _data ? JSON.stringify(_data) : "{}",
                undirected: undirected
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
}(window.clique, window.jQuery, window._, window.Backbone, window.tangelo));
