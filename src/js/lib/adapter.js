(function (cf, _) {
    "use strict";

    cf.adapter = {};

    cf.adapter.NodeEdgeList = function (cfg) {
        var nodes = cfg.nodes,
            links = cfg.links,
            nodeIndex = {},
            sourceIndex = {},
            targetIndex = {};

        if (!nodes) {
            throw cf.error.required("nodes");
        }

        if (!links) {
            throw cf.error.required("links");
        }

        _.each(nodes, function (n) {
            var hash = cf.util.md5(_.uniqueId() + JSON.stringify(n));
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
            getNeighborhood: function (options) {
                var center,
                    frontier,
                    neighborNodes = new cf.util.Set(),
                    neighborEdges = new cf.util.Set();

                if (!options.center) {
                    throw cf.error.required("name");
                }

                if (!options.radius) {
                    throw cf.error.required("radius");
                }

                // center = nodeIndex[options.node];
                center = _.findWhere(nodes, options.center);

                if (center) {
                    neighborNodes.add(center.key);

                    frontier = new cf.util.Set();
                    frontier.add(center.key);

                    // Fan out from the center to reach the requested radius.
                    _.each(_.range(options.radius), function () {
                        var newFrontier = new cf.util.Set();

                        // Find all links to and from the current frontier
                        // nodes.
                        _.each(frontier.items(), function (nodeKey) {
                            _.each(sourceIndex[nodeKey], function (neighborKey) {
                                neighborEdges.add(JSON.stringify([nodeKey, neighborKey]));
                            });

                            _.each(targetIndex[nodeKey], function (neighborKey) {
                                neighborEdges.add(JSON.stringify([neighborKey, nodeKey]));
                            });
                        });

                        // Collect the nodes named in the links.
                        _.each(neighborEdges.items(), function (link) {
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
                    links: _.map(neighborEdges.items(), function (link) {
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
}(window.cf, window._));
