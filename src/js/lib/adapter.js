(function (clique, _) {
    "use strict";

    clique.adapter = {};

    clique.adapter.NodeLinkList = function (cfg) {
        var nodes = clique.util.deepCopy(cfg.nodes),
            links = clique.util.deepCopy(cfg.links),
            orig = cfg,
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

        window.matchmaker = matchmaker = function (spec) {
            var key,
                m,
                matcher,
                spec2;

            if (_.has(spec, "key")) {
                key = spec.key;

                spec2 = clique.util.deepCopy(spec);
                delete spec2.key;

                m = _.matcher(spec2);

                matcher = function (obj) {
                    return m(obj.data) && obj.key === key;
                };
            } else {
                matcher = _.compose(_.matcher(spec), _.property("data"));
            }

            return matcher;
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
            findNodes: function (spec, callback) {
                callback(_.map(_.pluck(_.filter(nodes, matchmaker(spec)), "key"), getMutator));
            },

            findNode: function (spec, callback) {
                var node = _.find(nodes, matchmaker(spec));

                if (node) {
                    node = getMutator(node.key);
                }

                callback(node);
            },

            neighborhood: function (options, callback) {
                var frontier,
                    neighborNodes = new clique.util.Set(),
                    neighborLinks = new clique.util.Set();

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
                                neighborLinks.add(JSON.stringify([nodeKey, neighborKey]));
                            }
                        });

                        _.each(targetIndex[nodeKey], function (neighborKey) {
                            if (options.deleted || !nodeIndex[neighborKey].data.deleted) {
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
                            source: link[0],
                            target: link[1]
                        };
                    })
                });
            },

            write: function (callback) {
                orig.nodes = clique.util.deepCopy(_.pluck(nodes, "data"));
                (callback || _.noop)();
            }
        };
    };
}(window.clique, window._));
