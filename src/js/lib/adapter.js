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

        console.log("nodeIndex", nodeIndex);

        _.each(edges, function (e) {
            var sourceNode = nodes[e.source],
                targetNode = nodes[e.target];

            sourceIndex[sourceNode.key] = sourceIndex[sourceNode.key] || {};
            sourceIndex[sourceNode.key][targetNode.key] = targetNode.key

            targetIndex[targetNode.key] = targetIndex[targetNode.key] || {};
            targetIndex[targetNode.key][sourceNode.key] = sourceNode.key;
        });

        console.log("sourceIndex", sourceIndex);
        console.log("targetIndex", targetIndex);

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
                    _.each(_.range(options.radius), function (i) {
                        console.log("hop", i);

                        var newFrontier = new cf.util.Set();

                        // Find all edges to and from the current frontier
                        // nodes.
                        console.log("frontier", frontier);
                        _.each(frontier.items(), function (nodeKey) {
                            _.each(sourceIndex[nodeKey], function (neighborKey) {
                                neighborEdges.add(JSON.stringify([nodeKey, neighborKey]));
                            });

                            _.each(targetIndex[nodeKey], function (neighborKey) {
                                neighborEdges.add(JSON.stringify([neighborKey, nodeKey]));
                            });
                        });

                        console.log("neighborEdges", neighborEdges.items());

                        // Collect the nodes named in the edges.
                        _.each(neighborEdges.items(), function (edge) {
                            edge = JSON.parse(edge);

                            console.log("edge", edge);

                            if (!neighborNodes.has(edge[0])) {
                                newFrontier.add(edge[0]);
                            }

                            if (!neighborNodes.has(edge[1])) {
                                newFrontier.add(edge[1]);
                            }

                            neighborNodes.add(edge[0]);
                            neighborNodes.add(edge[1]);
                        });

                        console.log("newFrontier", newFrontier.items());

                        frontier = newFrontier;
                    });
                }

                neighborNodes = neighborNodes.items();
/*                neighborNodes = _.keys(neighborNodes).sort(function (a, b) {*/
                    // return a - b;
                // });

                neighborEdges = neighborEdges.items();
/*                neighborEdges = _.keys(neighborEdges).sort(function (a, b) {*/
                    // return a[0] - b[0] === 0 ? a[1] - b[1] : a[0] - b[0];
                // });

                console.log(neighborNodes);
                console.log(neighborEdges);

                return {
                    nodes: _.map(neighborNodes, function (i) {
                        return nodeIndex[i];
                    }),
                    edges: _.map(neighborEdges, function (edge) {
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
