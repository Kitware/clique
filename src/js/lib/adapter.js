(function (clique, _, Backbone, $) {
    "use strict";

    clique.adapter = {};

    clique.Adapter = function (options) {
        var accessors;

        // Keep track of accessors.
        this.accessors = accessors = {};
        this.onNewAccessor = this.onNewAccessor || _.noop;
        this.addAccessor = function (blob) {
            var mut;

            if (!_.has(accessors, blob.key)) {
                accessors[blob.key] = new clique.util.Accessor(blob);
                this.onNewAccessor(mut);
            }

            mut = accessors[blob.key];

            return mut;
        };

        // Define methods.
        this.getAccessor = _.propertyOf(accessors);

        this.findNodes = function (cfg) {
            var spec = cfg.spec || {},
                offset = cfg.offset || 0,
                limit = cfg.limit;

            return $.when(this.findNodesRaw(spec, offset, limit))
                .then(_.partial(_.map, _, this.addAccessor, this));
        };

        this.findNode = function (spec) {
            var req = this.findNodes({
                spec: spec,
                offset: 0,
                limit: 1
            });

            return $.when(req).then(_.bind(function (results) {
                return results && results[0];
            }, this));
        };

        this.findNodeByKey = function (key) {
            return this.findNode({
                key: key
            });
        };

        this.findLinks = function (cfg) {
            var spec = cfg.spec,
                source = cfg.source,
                target = cfg.target,
                directed = cfg.directed,
                offset = cfg.offset,
                limit = cfg.limit;

            return $.when(this.findLinksRaw(spec, source, target, directed, offset, limit))
                .then(_.partial(_.map, _, this.addAccessor, this));
        };

        this.findLink = function (_cfg) {
            var cfg = _.extend({}, _cfg, {
                offset: 0,
                limit: 1
            });

            return $.when(this.findLinks(cfg)).then(_.bind(function (results) {
                return results && results[0];
            }, this));
        };

        this.findLinkByKey = function (key) {
            return this.findLink({
                key: key
            });
        };

        this.neighborLinkCount = function (node, opts) {
            return this.neighborLinks(node, opts).then(_.size);
        };

        this.outgoingLinkCount = function (node) {
            return this.neighborLinkCount(node, {
                outgoing: true,
                incoming: false,
                undirected: false
            });
        };

        this.outflowingLinkCount = function (node) {
            return this.neighborLinkCount(node, {
                outgoing: true,
                incoming: false,
                undirected: true
            });
        };

        this.incomingLinkCount = function (node) {
            return this.neighborLinkCount(node, {
                outgoing: false,
                incoming: true,
                undirected: false
            });
        };

        this.inflowingLinkCount = function (node) {
            return this.neighborLinkCount(node, {
                outgoing: false,
                incoming: true,
                undirected: true
            });
        };

        this.undirectedLinkCount = function (node) {
            return this.neighborLinkCount(node, {
                outgoing: false,
                incoming: false,
                undirected: true
            });
        };

        this.directedLinkCount = function (node) {
            return this.neighborLinkCount(node, {
                outgoing: true,
                incoming: true,
                undirected: false
            });
        };

        this.neighborLinks = function (node, cfg) {
            var types,
                offset,
                limit;

            cfg = cfg || {};

            types = cfg.types || {};
            offset = cfg.offset;
            limit = cfg.limit;

            return this.neighborLinksRaw(node, types, offset, limit)
                .then(_.partial(_.map, _, this.addAccessor, this));
        };

        this.neighborLinksRaw = function (node, _types, offset, limit) {
            var reqs = [],
                types = {};

            _.each(["outgoing", "incoming", "undirected"], function (mode) {
                types[mode] = _.isUndefined(_types[mode]) ? true : _types[mode];
            });

            if (types.outgoing) {
                reqs.push(this.findLinksRaw(undefined, node.key(), undefined, true));
            }

            if (types.incoming) {
                reqs.push(this.findLinksRaw(undefined, undefined, node.key(), true));
            }

            if (types.undirected) {
                reqs.push(this.findLinksRaw(undefined, node.key(), undefined, false));
                reqs.push(this.findLinksRaw(undefined, undefined, node.key(), false));
            }

            return $.when.apply($, reqs).then(function () {
                // This pipeline zips together the list of results, then
                // flattens the resulting list-of-lists, removes all undefineds
                // (which may arise if some of the lists are shorter than
                // others), then finally slices the result to get the final list
                // of links.
                return _.filter(_.flatten(_.zip.apply(_, _.toArray(arguments))), _.negate(_.isUndefined))
                    .slice(offset || 0, (offset + limit) || undefined);
            });
        };

        this.outgoingLinks = function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: true,
                    incoming: false,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        };

        this.outflowingLinks = function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: true,
                    incoming: false,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        };

        this.incomingLinks = function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: false,
                    incoming: true,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        };

        this.inflowingLinks = function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: false,
                    incoming: true,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        };

        this.undirectedLinks = function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: false,
                    incoming: false,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        };

        this.directedLinks = function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: true,
                    incoming: true,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        };

        this.neighborCount = function (node, opts) {
            return this.neighbors(node, opts).then(function (nbrs) {
                return _.size(nbrs.nodes);
            });
        };

        this.outgoingNeighborCount = function (node) {
            return this.neighborCount(node, {
                outgoing: true,
                incoming: false,
                undirected: false
            });
        };

        this.outflowingNeighborCount = function (node) {
            return this.neighborCount(node, {
                outgoing: true,
                incoming: false,
                undirected: true
            });
        };

        this.incomingNeighborCount = function (node) {
            return this.neighborCount(node, {
                outgoing: false,
                incoming: true,
                undirected: false
            });
        };

        this.inflowingNeighborCount = function (node) {
            return this.neighborCount(node, {
                outgoing: false,
                incoming: true,
                undirected: true
            });
        };

        this.undirectedNeighborCount = function (node) {
            return this.neighborCount(node, {
                outgoing: false,
                incoming: false,
                undirected: true
            });
        };

        this.directedNeighborCount = function (node) {
            return this.neighborCount(node, {
                outgoing: true,
                incoming: true,
                undirected: false
            });
        };

        this.neighbors = function (node, opts) {
            var key = node.key(),
                links;

            return this.neighborLinks(node, opts).then(_.bind(function (links_) {
                var neighborKeys,
                    muts;

                links = links_;

                neighborKeys = _.map(links, function (link) {
                    return key === link.source() ? link.target() : link.source();
                });

                // Attempt to retrieve the accessors.  The ones we don't have
                // yet will show up as undefined in this array.
                muts = _.map(neighborKeys, this.getAccessor, this);

                _.each(muts, function (mut, i) {
                    if (_.isUndefined(mut)) {
                        muts[i] = this.findNodeByKey(neighborKeys[i]);
                    } else {
                        muts[i] = $.when(muts[i]);
                    }
                }, this);

                return $.when.apply($, muts);
            }, this)).then(function () {
                return {
                    nodes: _.toArray(arguments),
                    links: links
                };
            });
        };

        this.outgoingNeighbors = function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: true,
                    incoming: false,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        };

        this.outflowingNeighbors = function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: true,
                    incoming: false,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        };

        this.incomingNeighbors = function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: false,
                    incoming: true,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        };

        this.inflowingNeighbors = function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: false,
                    incoming: true,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        };

        this.undirectedNeighbors = function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: false,
                    incoming: false,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        };

        this.directedNeighbors = function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: true,
                    incoming: true,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        };

        this.createNode = function (data) {
            return $.when(this.createNodeRaw(data || {}))
                .then(_.bind(this.addAccessor, this));
        };

        this.createLink = function (source, target, _data, undirected) {
            var data;

            // If source/target is a accessor, call its key method to get the
            // key; otherwise, assume it is a string describing the key already.
            source = _.result(source, "key", source);
            target = _.result(target, "key", target);

            data = _data || {};
            undirected = _.isUndefined(undirected) ? false : undirected;

            return $.when(this.createLinkRaw(source, target, data, undirected))
                .then(_.bind(this.addAccessor, this));
        };

        this.destroyNode = function (node) {
            var key = node.key();
            return this.destroyNodeRaw(key).then(function (response) {
                return {
                    key: key,
                    response: response
                };
            });
        };

        this.destroyLink = function (link) {
            var key = link.key();
            return this.destroyLinkRaw(key).then(function (response) {
                return {
                    key: key,
                    response: response
                };
            });
        };

        options = options || {};
        this.initialize.apply(this, arguments);
    };

    clique.Adapter.extend = Backbone.Model.extend;

    clique.adapter.NodeLinkList = clique.Adapter.extend({
        initialize: function (options) {
            var table = {};

            this.nodes = clique.util.deepCopy(options.nodes);
            this.links = clique.util.deepCopy(options.links);

            _.each(this.nodes, function (node, i) {
                var tmpNs = "datax",
                    ns;

                // Promote the data elements into a dedicated namespace.
                //
                // First figure out a suitable temporary name to use for the
                // namespace.
                while (_.has(node, tmpNs)) {
                    tmpNs += "x";
                }

                // Create the namespace.
                ns = node[tmpNs] = {};

                // Move all top-level properties into the namespace.
                _.each(node, function (v, k) {
                    if (k !== tmpNs) {
                        ns[k] = v;
                        delete node[k];
                    }
                });

                // Rename the temporary namespace as "data".
                if (tmpNs !== "data") {
                    node.data = ns;
                    delete node[tmpNs];
                }

                table[i] = node;

                // Assign a unique key to this node.
                node.key = _.uniqueId("node_");
            });

            _.each(this.links, function (link) {
                link.key = _.uniqueId("link_");

                link.source = table[link.source];
                link.target = table[link.target];
            }, this);
        },

        findNodesRaw: function (_spec, offset, limit) {
            var spec = clique.util.deepCopy(_spec),
                searchspace = this.nodes,
                result;

            if (spec.key) {
                searchspace = _.filter(searchspace, function (node) {
                    return node.key === spec.key;
                });

                delete spec.key;
            }

            result = _.filter(searchspace, function (node) {
                return _.isMatch(node.data, spec);
            });

            return result.slice(offset || 0, (offset + limit) || undefined);
        },

        findLinksRaw: function (spec, source, target, directed, offset, limit) {
            return _.filter(this.links, function (link) {
                var directedMatch,
                    sourceMatch = _.isUndefined(source) || (link.source.key === source),
                    targetMatch = _.isUndefined(target) || (link.target.key === target),
                    dataMatch = _.isMatch(spec || {}, link.data);

                if (_.isUndefined(directed) || _.isNull(directed)) {
                    directedMatch = true;
                } else if (directed) {
                    directedMatch = !link.undirected;
                } else {
                    directedMatch = link.undirected;
                }

                return _.every([sourceMatch, targetMatch, dataMatch, directedMatch]);
            }).slice(offset || 0, (offset + limit) || undefined);
        }
    });
}(window.clique, window._, window.Backbone, window.jQuery));
