(function (clique, _, $) {
    "use strict";

    clique.adapter = {};

    clique.adapter.Adapter = function (methods) {
        var checklist,
            missing,
            addMutator,
            onNewMutator,
            mutators;

        // Check for missing required methods.
        checklist = [
            "findNodes",
            "findLinks",
            "newNode",
            "newLink",
            "destroyNode",
            "destroyLink"
        ];

        missing = _.filter(checklist, function (method) {
            return !this[method];
        }, this);

        if (_.size(missing) > 0) {
            throw new Error("adapter instance missing the following required methods: " + missing.join(", "));
        }

        // Keep track of mutators.
        mutators = {};
        onNewMutator = methods.onNewMutator || _.noop;
        addMutator = _.bind(function (blob) {
            var mut;

            if (!_.has(mutators, blob.key)) {
                mut = mutators[blob.key] = new clique.util.Mutator(blob);
                onNewMutator(mut);
            }

            return mut;
        }, this);

        // Construct an adapter instance.
        return {
            getMutator: _.propertyOf(mutators),

            findNodes: function (spec) {
                return methods.findNodes(spec).then(_.partial(_.map, _, addMutator, this));
            },

            findNode: function (spec) {
                return methods.findNodes(spec).then(function (results) {
                    if (_.isEmpty(results)) {
                        return undefined;
                    }

                    return addMutator(results[0]);
                });
            },

            findNodeByKey: function (key) {
                return this.findNode({
                    key: key
                });
            },

            findLinks: function (spec) {
                return methods.findLinks(spec).then(_.partial(_.map, _, addMutator, this));
            },

            findLink: function (spec) {
                return methods.findLinks(spec).then(function (results) {
                    if (_.isEmpty(results)) {
                        return undefined;
                    }

                    return addMutator(results[0]);
                });
            },

            findLinkByKey: function (key) {
                return this.findLink({
                    key: key
                });
            },

            getNeighborLinks: function (node, opts) {
                var reqs = [];

                opts = opts || {};
                _.each(["outgoing", "incoming", "undirected"], function (mode) {
                    opts[mode] = _.isUndefined(opts[mode]) ? true : opts[mode];
                });

                if (opts.outgoing) {
                    reqs.push(this.findLinks({
                        source: node.key(),
                        undirected: false
                    }));
                }

                if (opts.incoming) {
                    reqs.push(this.findLinks({
                        target: node.key(),
                        undirected: false
                    }));
                }

                if (opts.undirected) {
                    reqs.push(this.findLinks({
                        source: node.key(),
                        undirected: true
                    }));

                    reqs.push(this.findLinks({
                        target: node.key(),
                        undirected: true
                    }));
                }

                return $.when.apply($, reqs).then(_.compose(_.partial(_.uniq, _, _.partial(_.invoke, "key")), _.partial(_.map, _, addMutator, this)));
            },

            getOutgoingLinks: function (node) {
                return this.getNeighborLinks(node, {
                    outgoing: true,
                    incoming: false,
                    undirected: false
                });
            },

            getOutflowingLinks: function (node) {
                return this.getNeighborLinks(node, {
                    outgoing: true,
                    incoming: false,
                    undirected: true
                });
            },

            getIncomingLinks: function (node) {
                return this.getNeighborLinks(node, {
                    outgoing: false,
                    incoming: true,
                    undirected: false
                });
            },

            getInflowingLinks: function (node) {
                return this.getNeighborLinks(node, {
                    outgoing: false,
                    incoming: true,
                    undirected: true
                });
            },

            getUndirectedLinks: function (node) {
                return this.getNeighborLinks(node, {
                    outgoing: false,
                    incoming: false,
                    undirected: true
                });
            },

            getDirectedLinks: function (node) {
                return this.getNeighborLinks(node, {
                    outgoing: true,
                    incoming: true,
                    undirected: false
                });
            },

            getNeighbors: function (node, opts) {
                var key = node.key();
                return this.getNeighborLinks(node, opts).then(_.partial(_.map, _, function (link) {
                    return key === link.source() ? link.target() : link.source();
                }, this));
            },

            getOutgoingNeighbors: function (node) {
                return this.getNeighbors(node, {
                    outgoing: true,
                    incoming: false,
                    undirected: false
                });
            },

            getOutflowingNeighbors: function (node) {
                return this.getNeighbors(node, {
                    outgoing: true,
                    incoming: false,
                    undirected: true
                });
            },

            getIncomingNeighbors: function (node) {
                return this.getNeighbors(node, {
                    outgoing: false,
                    incoming: true,
                    undirected: false
                });
            },

            getInflowingNeighbors: function (node) {
                return this.getNeighbors(node, {
                    outgoing: false,
                    incoming: true,
                    undirected: true
                });
            },

            getUndirectedNeighbors: function (node) {
                return this.getNeighbors(node, {
                    outgoing: false,
                    incoming: false,
                    undirected: true
                });
            },

            getDirectedNeighbors: function (node) {
                return this.getNeighbors(node, {
                    outgoing: true,
                    incoming: true,
                    undirected: false
                });
            },

            newNode: function (data) {
                return methods.newNode(data || {}).then(_.bind(addMutator, this));
            },

            newLink: function (opts) {
                clique.util.require(opts.source, "source");
                clique.util.require(opts.target, "target");

                return methods.newLink({
                    source: opts.source,
                    target: opts.target,
                    undirected: _.isUndefined(opts.undirected) ? false : opts.undirected,
                    data: opts.data || {}
                }).then(_.bind(addMutator, this));
            },

            destroyNode: methods.destroyNode,

            destroyLink: methods.destroyLink
        };
    };

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
                mutators[key] = new clique.util.Mutator(nodeIndex[key]);
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
