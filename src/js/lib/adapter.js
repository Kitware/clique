(function (cf, _) {
    "use strict";

    cf.adapter = {};

    cf.adapter.NodeEdgeList = function (cfg) {
        var nodes = cfg.nodes,
            edges = cfg.edges,
            nodeIndex = {},
            sourceIndex = {},
            targetIndex = {};

        if (!nodes) {
            throw cf.error.required("nodes");
        }

        if (!edges) {
            throw cf.error.required("edges");
        }

        _.each(nodes, function (n) {
            var hash = cf.util.md5(_.uniqueId() + JSON.stringify(n));
            n.key = hash;
            nodeIndex[hash] = n;
        });

        _.each(edges, function (e) {
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

                        // Find all edges to and from the current frontier
                        // nodes.
                        _.each(frontier.items(), function (nodeKey) {
                            _.each(sourceIndex[nodeKey], function (neighborKey) {
                                neighborEdges.add(JSON.stringify([nodeKey, neighborKey]));
                            });

                            _.each(targetIndex[nodeKey], function (neighborKey) {
                                neighborEdges.add(JSON.stringify([neighborKey, nodeKey]));
                            });
                        });

                        // Collect the nodes named in the edges.
                        _.each(neighborEdges.items(), function (edge) {
                            edge = JSON.parse(edge);

                            if (!neighborNodes.has(edge[0])) {
                                newFrontier.add(edge[0]);
                            }

                            if (!neighborNodes.has(edge[1])) {
                                newFrontier.add(edge[1]);
                            }

                            neighborNodes.add(edge[0]);
                            neighborNodes.add(edge[1]);
                        });

                        frontier = newFrontier;
                    });
                }

                return {
                    nodes: _.map(neighborNodes.items(), _.propertyOf(nodeIndex)),
                    edges: _.map(neighborEdges.items(), function (edge) {
                        edge = JSON.parse(edge);

                        return {
                            source: nodeIndex[edge[0]],
                            target: nodeIndex[edge[1]]
                        };
                    })
                };
            }
        };
    };
}(window.cf, window._));
