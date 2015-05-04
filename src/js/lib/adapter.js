(function (clique, _) {
    "use strict";

    clique.adapter = {};

    clique.adapter.NodeLinkList = function (cfg) {
        var nodes = cfg.nodes,
            links = cfg.links,
            nodeIndex = {},
            sourceIndex = {},
            targetIndex = {};

        if (!nodes) {
            throw clique.error.required("nodes");
        }

        if (!links) {
            throw clique.error.required("links");
        }

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
            findNodes: function (spec) {
                return _.pluck(_.where(nodes, spec), "key");
            },

            getNode: function (key) {
                return nodeIndex[key];
            },

            getNeighborhood: function (options) {
                var center,
                    frontier,
                    neighborNodes = new clique.util.Set(),
                    neighborLinks = new clique.util.Set();

                if (!options.center) {
                    throw clique.error.required("center");
                }

                if (!options.radius) {
                    throw clique.error.required("radius");
                }

                center = nodeIndex[options.center];
                center.root = true;

                if (center) {
                    neighborNodes.add(center.key);

                    frontier = new clique.util.Set();
                    frontier.add(center.key);

                    // Fan out from the center to reach the requested radius.
                    _.each(_.range(options.radius), function () {
                        var newFrontier = new clique.util.Set();

                        // Find all links to and from the current frontier
                        // nodes.
                        _.each(frontier.items(), function (nodeKey) {
                            _.each(sourceIndex[nodeKey], function (neighborKey) {
                                neighborLinks.add(JSON.stringify([nodeKey, neighborKey]));
                            });

                            _.each(targetIndex[nodeKey], function (neighborKey) {
                                neighborLinks.add(JSON.stringify([neighborKey, nodeKey]));
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
                }

                return {
                    nodes: _.map(neighborNodes.items(), _.propertyOf(nodeIndex)),
                    links: _.map(neighborLinks.items(), function (link) {
                        link = JSON.parse(link);

                        return {
                            source: nodeIndex[link[0]],
                            target: nodeIndex[link[1]]
                        };
                    })
                };
            }
        };
    };
}(window.clique, window._));
