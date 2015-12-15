(function (clique, $, _, Backbone, tangelo) {
    "use strict";

    var processNode,
        processLink;

    processNode = function (response) {
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
    };

    processLink = function (response) {
        var result = {};

        delete response.type;

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
    };

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

        findNodesRaw: function (spec, offset, limit) {
            var data;

            data = _.extend({
                spec: JSON.stringify(spec || {}),
                offset: offset || 0,
                limit: limit || 0,
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/findNodes", data)
                .then(_.partial(_.map, _, processNode, undefined));
        },

        findLinksRaw: function (spec, source, target, directed, offset, limit) {
            var data;

            data = _.extend({
                spec: JSON.stringify(spec || {}),
                source: source,
                target: target,
                directed: JSON.stringify(_.isUndefined(directed) ? null : directed),
                offset: offset || 0,
                limit: limit || 0
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/findLinks", data)
                .then(_.partial(_.map, _, processLink, undefined));
        },

        neighborLinksRaw: function (node, types, offset, limit) {
            var data;

            types = types || {};
            data = _.extend({
                node: node.key(),
                outgoing: _.isUndefined(types.outgoing) ? true : types.outgoing,
                incoming: _.isUndefined(types.incoming) ? true : types.incoming,
                undirected: _.isUndefined(types.undirected) ? true : types.undirected,
                offset: offset || 0,
                limit: limit || 0
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/neighborLinks", data)
                .then(_.partial(_.map, _, processLink, undefined));
        },

        neighborLinkCount: function (node, opts) {
            var data;

            opts = opts || {};
            data = _.extend({
                node: node.key(),
                outgoing: _.isUndefined(opts.outgoing) ? true : opts.outgoing,
                incoming: _.isUndefined(opts.incoming) ? true : opts.incoming,
                undirected: _.isUndefined(opts.undirected) ? true : opts.undirected
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/neighborLinkCount", data);
        },

        neighborCount: function (node, opts) {
            var data;

            opts = opts || {};
            data = _.extend({
                node: node.key(),
                outgoing: _.isUndefined(opts.outgoing) ? true : opts.outgoing,
                incoming: _.isUndefined(opts.incoming) ? true : opts.incoming,
                undirected: _.isUndefined(opts.undirected) ? true : opts.undirected
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/neighborCount", data);
        },

        createNodeRaw: function (_data) {
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

        createLinkRaw: function (source, target, _data, undirected) {
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

        destroyNodeRaw: function (key) {
            var data;

            data = _.extend({
                key: key
            }, this.mongoStore);

            return $.get("plugin/mongo/destroyNode", data);
        },

        destroyLinkRaw: function (key) {
            var data;

            data = _.extend({
                key: key
            }, this.mongoStore);

            return $.get("plugin/mongo/destroyLink", data);
        },

        neighborhood: function (node, radius, linklimit) {
            var data = _.extend({
                start_key: node.key(),
                radius: radius,
                linklimit: linklimit
            }, this.mongoStore);

            return $.getJSON("plugin/mongo/neighborhood", data);
        },
    });
}(window.clique, window.jQuery, window._, window.Backbone, window.tangelo));
