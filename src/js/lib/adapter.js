(function (clique, _) {
    "use strict";

    clique.adapter = {};

    clique.adapter.NodeLinkList = function (cfg) {
        var nodes = clique.util.deepCopy(cfg.nodes),
            links = clique.util.deepCopy(cfg.links),
            orig = cfg,
            nodeIndex = {},
            sourceIndex = {},
            targetIndex = {};

        clique.util.require(nodes, "nodes");
        clique.util.require(links, "links");

        _.each(nodes, function (n) {
            var hash = clique.util.md5(_.uniqueId() + JSON.stringify(n));
            n.key = hash;
            nodeIndex[hash] = n;
        });

        _.each(links, function (e) {
            var sourceNode = nodes[e.source],
                targetNode = nodes[e.target];

            sourceIndex[sourceNode.key] = sourceIndex[sourceNode.key] || {};
            sourceIndex[sourceNode.key][targetNode.key] = targetNode.key;

            targetIndex[targetNode.key] = targetIndex[targetNode.key] || {};
            targetIndex[targetNode.key][sourceNode.key] = sourceNode.key;
        });

        return {
            findNodes: function (spec, callback) {
                callback(_.where(nodes, spec));
            },

            findNode: function (spec, callback) {
                callback(_.findWhere(nodes, spec));
            },

            neighborhood: function (options, callback) {
                var frontier,
                    neighborNodes = new clique.util.Set(),
                    neighborLinks = new clique.util.Set();

                clique.util.require(options.center, "center");
                clique.util.require(options.radius, "radius");

                options.center.root = true;

                frontier = new clique.util.Set();

                // Don't start the process with a "deleted" node (unless deleted
                // nodes are specifically allowed).
                if (options.deleted || !options.center.deleted) {
                    neighborNodes.add(options.center.key);
                    frontier.add(options.center.key);
                }

                // Fan out from the center to reach the requested radius.
                _.each(_.range(options.radius), function () {
                    var newFrontier = new clique.util.Set();

                    // Find all links to and from the current frontier
                    // nodes.
                    _.each(frontier.items(), function (nodeKey) {
                        // Do not add links to nodes that are deleted (unless
                        // deleted nodes are specifically allowed).
                        _.each(sourceIndex[nodeKey], function (neighborKey) {
                            if (options.deleted || !nodeIndex[neighborKey].deleted) {
                                neighborLinks.add(JSON.stringify([nodeKey, neighborKey]));
                            }
                        });

                        _.each(targetIndex[nodeKey], function (neighborKey) {
                            if (options.deleted || !nodeIndex[neighborKey].deleted) {
                                neighborLinks.add(JSON.stringify([neighborKey, nodeKey]));
                            }
                        });
                    });

                    // Collect the nodes named in the links.
                    _.each(neighborLinks.items(), function (link) {
                        link = JSON.parse(link);

                        if (!neighborNodes.has(link[0])) {
                            newFrontier.add(link[0]);
                        }

                        if (!neighborNodes.has(link[1])) {
                            newFrontier.add(link[1]);
                        }

                        neighborNodes.add(link[0]);
                        neighborNodes.add(link[1]);
                    });

                    frontier = newFrontier;
                });

                callback({
                    nodes: _.map(neighborNodes.items(), _.propertyOf(nodeIndex)),
                    links: _.map(neighborLinks.items(), function (link) {
                        link = JSON.parse(link);

                        return {
                            source: nodeIndex[link[0]],
                            target: nodeIndex[link[1]]
                        };
                    })
                });
            },

            write: function (callback) {
                orig.nodes = _.map(nodes, function (n) {
                    var node = {};
                    _.map(n, function (value, key) {
                        if (!clique.ignore.has(key)) {
                            node[key] = clique.util.deepCopy(value);
                        }
                    });

                    return node;
                });

                callback();
            }
        };
    };
}(window.clique, window._));
