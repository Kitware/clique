(function (cf, _) {
    "use strict";

    cf.adapter = {};

    cf.adapter.NodeEdgeList = function (cfg) {
        var nodes = cfg.nodes,
            edges = cfg.edges,
            nodeIndex = {},
            edgeIndex = {}, sourceIndex = {},
            targetIndex = {};

        if (!nodes) {
            throw cf.error.required("nodes");
        }

        if (!edges) {
            throw cf.error.required("edges");
        }

        _.each(nodes, function (n, i) {
            if (_.has(nodeIndex, n.name)) {
                throw new Error("duplicate name '" + n.name + "' in node list");
            }

            nodeIndex[n.name] = n;
            n.index = i;
        });

        _.each(edges, function (e) {
            edgeIndex[[e.source, e.target]] = e;

            sourceIndex[e.source] = sourceIndex[e.source] || {};
            sourceIndex[e.source][e.target] = e;

            targetIndex[e.target] = targetIndex[e.target] || {};
            targetIndex[e.target][e.source] = e;
        });

        return {
            getNeighborhood: function (options) {
                var center,
                    frontier = {},
                    neighborNodes = {},
                    neighborEdges = {};

                if (!options.name) {
                    throw cf.error.required("name");
                }

                if (!options.radius) {
                    throw cf.error.required("radius");
                }

                center = nodeIndex[options.name];

                if (center) {
                    neighborNodes[center.index] = true;
                    frontier[center.index] = true;

                    // Fan out from the center to reach the requested radius.
                    _.each(_.range(options.radius), function () {
                        var newFrontier = {};

                        // Find all edges to and from the current frontier
                        // nodes.
                        _.each(frontier, function (node) {
                            _.each(sourceIndex[node.index], function (neighbor) {
                                neighborEdges[[node.index, neighbor]] = true;
                            });

                            _.each(targetIndex[node.index], function (neighbor) {
                                neighborEdges[[neighbor, node.index]] = true;
                            });
                        });

                        // Collect the nodes named in the edges.
                        _.each(neighborEdges, function (dummy, edge) {
                            if (!_.has(neighborNodes, edge[0])) {
                                newFrontier[edge[0]] = true;
                            }

                            if (!_.has(neighborNodes, edge[1])) {
                                newFrontier[edge[1]] = true;
                            }

                            neighborNodes[edge[0]] = true;
                            neighborNodes[edge[1]] = true;
                        });

                        frontier = newFrontier;
                    });
                }

                neighborNodes = _.keys(neighborNodes).sort(function (a, b) {
                    return a - b;
                });

                neighborEdges = _.keys(neighborEdges).sort(function (a, b) {
                    return a[0] - b[0] === 0 ? a[1] - b[1] : a[0] - b[0];
                });

                console.log(neighborNodes);
                console.log(neighborEdges);

                return {
                    nodes: _.map(neighborNodes, function (i) {
                        return nodes[i];
                    }),
                    edges: _.map(neighborEdges, function (edge) {
                        return {
                            source: edge[0],
                            target: edge[1]
                        };
                    })
                };
            }
        };
    };
}(window.cf, window._));
