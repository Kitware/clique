(function (clique, _, $) {
    "use strict";

    clique.adapter = {};

    clique.adapter.NodeLinkList = function (cfg) {
        var nodes = clique.util.deepCopy(cfg.nodes),
            links = clique.util.deepCopy(cfg.links),
            nodeIndex = {},
            sourceIndex = {},
            targetIndex = {},
            mutators = {},
            getMutator,
            matchmaker;

        clique.util.require(nodes, "nodes");
        clique.util.require(links, "links");

        getMutator = function (key) {
            if (!_.has(nodeIndex, key)) {
                return undefined;
            }

            if (!_.has(mutators, key)) {
                mutators[key] = new clique.util.Mutator({
                    target: nodeIndex[key]
                });
            }

            return mutators[key];
        };

        matchmaker = function (spec) {
            if (spec.queryOp) {
                if (spec.queryOp !== "==") {
                    throw new Error("query operators besides == are not supported in this adapter");
                }

                if (spec.field === "key") {
                    return function (obj) {
                        return obj.key === spec.value;
                    };
                } else {
                    return function (obj) {
                        return (obj.data || {})[spec.field] === spec.value;
                    };
                }
            } else if (spec.logicOp) {
                if (spec.logicOp === "and") {
                    return function (obj) {
                        return matchmaker(spec.left)(obj) && matchmaker(spec.right)(obj);
                    };
                } else if (spec.logicOp === "or") {
                    return function (obj) {
                        return matchmaker(spec.left)(obj) || matchmaker(spec.right)(obj);
                    };
                } else {
                    throw new Error("illegal logic operator '" + spec.logicOp + "'");
                }
            } else {
                throw new Error("query expression must have either a logicOp or queryOp field");
            }
        };

        _.each(nodes, function (n) {
            var hash,
                ns,
                tmpNs = "data";

            // Promote the data elements into a dedicated namespace.
            //
            // First figure out a suitable temporary name to use for the
            // namespace.
            while (_.has(n, tmpNs)) {
                tmpNs += "x";
            }

            // Create the namespace.
            ns = n[tmpNs] = {};

            // Move all top-level properties into the namespace.
            _.each(n, function (v, k) {
                if (k !== tmpNs) {
                    ns[k] = v;
                    delete n[k];
                }
            });

            // Rename the temporary namespace as "data".
            if (tmpNs !== "data") {
                n.data = ns;
                delete n[tmpNs];
            }

            // Install a unique key in the node.
            hash = clique.util.md5(_.uniqueId() + JSON.stringify(n));
            n.key = hash;

            // Store the node in the hash table.
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
                var def = new $.Deferred();
                def.resolve(_.map(_.pluck(_.filter(nodes, matchmaker(spec)), "key"), getMutator));
                return def;
            },

            findNode: function (spec) {
                var node = _.find(nodes, matchmaker(spec)),
                    def = new $.Deferred();

                if (node) {
                    node = getMutator(node.key);
                }

                def.resolve(node);
                return def;
            },

            neighborhood: function (options) {
                var frontier,
                    neighborNodes = new clique.util.Set(),
                    neighborLinks = new clique.util.Set(),
                    def = new $.Deferred();

                clique.util.require(options.center, "center");
                clique.util.require(options.radius, "radius");

                options.center.setTransient("root", true);

                frontier = new clique.util.Set();

                // Don't start the process with a "deleted" node (unless deleted
                // nodes are specifically allowed).
                if (options.deleted || !options.center.getData("deleted")) {
                    neighborNodes.add(options.center.key());
                    frontier.add(options.center.key());
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
                            if (options.deleted || !nodeIndex[neighborKey].data.deleted) {
                                neighborLinks.add(JSON.stringify({
                                    key: clique.util.md5(JSON.stringify([nodeKey, neighborKey]) + _.unique()),
                                    source: nodeKey,
                                    target: neighborKey
                                }));
                            }
                        });

                        _.each(targetIndex[nodeKey], function (neighborKey) {
                            if (options.deleted || !nodeIndex[neighborKey].data.deleted) {
                                neighborLinks.add(JSON.stringify({
                                    key: clique.util.md5(JSON.stringify([neighborKey, nodeKey]) + _.unique()),
                                    source: neighborKey,
                                    target: nodeKey
                                }));
                            }
                        });
                    });

                    // Collect the nodes named in the links.
                    _.each(neighborLinks.items(), function (link) {
                        link = JSON.parse(link);

                        if (!neighborNodes.has(link.source)) {
                            newFrontier.add(link.source);
                        }

                        if (!neighborNodes.has(link.target)) {
                            newFrontier.add(link.target);
                        }

                        neighborNodes.add(link.source);
                        neighborNodes.add(link.target);
                    });

                    frontier = newFrontier;
                });

                def.resolve({
                    nodes: _.map(neighborNodes.items(), _.propertyOf(nodeIndex)),
                    links: _.map(neighborLinks.items(), JSON.parse)
                });
                return def;
            },

            getMutator: getMutator
        };
    };
}(window.clique, window._, window.jQuery));
