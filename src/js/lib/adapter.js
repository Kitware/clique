(function (clique, _, Backbone, $) {
    "use strict";

    clique.adapter = {};

    clique.Adapter = function () {
        // Keep track of accessors.
        this.accessors = {};
        this.onNewAccessor = this.onNewAccessor || _.noop;
        this.addAccessor = function (blob) {
            var mut,
                accessors = this.accessors;

            if (!_.has(accessors, blob.key)) {
                accessors[blob.key] = new clique.util.Accessor(blob);
                this.onNewAccessor(mut);
            }

            mut = accessors[blob.key];

            return mut;
        };

        this.getAccessor = _.propertyOf(this.accessors);

        this.initialize.apply(this, arguments);
    };

    _.extend(clique.Adapter.prototype, {
        // Define class methods.
        initialize: _.noop,

        findNodes: function (cfg) {
            var spec = cfg.spec || {},
                offset = cfg.offset || 0,
                limit = cfg.limit;

            return $.when(this.findNodesRaw(spec, offset, limit))
                .then(_.partial(_.map, _, this.addAccessor, this));
        },

        findNode: function (spec) {
            var req = this.findNodes({
                spec: spec,
                offset: 0,
                limit: 1
            });

            return $.when(req).then(_.bind(function (results) {
                return results && results[0];
            }, this));
        },

        findNodeByKey: function (key) {
            return this.findNode({
                key: key
            });
        },

        findLinks: function (cfg) {
            var spec = cfg.spec,
                source = cfg.source,
                target = cfg.target,
                directed = cfg.directed,
                offset = cfg.offset,
                limit = cfg.limit;

            return $.when(this.findLinksRaw(spec, source, target, directed, offset, limit))
                .then(_.partial(_.map, _, this.addAccessor, this));
        },

        findLink: function (_cfg) {
            var cfg = _.extend({}, _cfg, {
                offset: 0,
                limit: 1
            });

            return $.when(this.findLinks(cfg)).then(_.bind(function (results) {
                return results && results[0];
            }, this));
        },

        findLinkByKey: function (key) {
            return this.findLink({
                key: key
            });
        },

        neighborLinkCount: function (node, opts) {
            return this.neighborLinks(node, opts).then(_.size);
        },

        outgoingLinkCount: function (node) {
            return this.neighborLinkCount(node, {
                outgoing: true,
                incoming: false,
                undirected: false
            });
        },

        outflowingLinkCount: function (node) {
            return this.neighborLinkCount(node, {
                outgoing: true,
                incoming: false,
                undirected: true
            });
        },

        incomingLinkCount: function (node) {
            return this.neighborLinkCount(node, {
                outgoing: false,
                incoming: true,
                undirected: false
            });
        },

        inflowingLinkCount: function (node) {
            return this.neighborLinkCount(node, {
                outgoing: false,
                incoming: true,
                undirected: true
            });
        },

        undirectedLinkCount: function (node) {
            return this.neighborLinkCount(node, {
                outgoing: false,
                incoming: false,
                undirected: true
            });
        },

        directedLinkCount: function (node) {
            return this.neighborLinkCount(node, {
                outgoing: true,
                incoming: true,
                undirected: false
            });
        },

        neighborLinks: function (node, cfg) {
            var types,
                offset,
                limit;

            cfg = cfg || {};

            types = cfg.types || {};
            offset = cfg.offset;
            limit = cfg.limit;

            return this.neighborLinksRaw(node, types, offset, limit)
                .then(_.partial(_.map, _, this.addAccessor, this));
        },

        outgoingLinks: function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: true,
                    incoming: false,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        },

        outflowingLinks: function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: true,
                    incoming: false,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        },

        incomingLinks: function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: false,
                    incoming: true,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        },

        inflowingLinks: function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: false,
                    incoming: true,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        },

        undirectedLinks: function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: false,
                    incoming: false,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        },

        directedLinks: function (node, offset, limit) {
            return this.neighborLinks(node, {
                types: {
                    outgoing: true,
                    incoming: true,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        },

        neighborCount: function (node, opts) {
            return this.neighbors(node, opts).then(function (nbrs) {
                return _.size(nbrs.nodes);
            });
        },

        outgoingNeighborCount: function (node) {
            return this.neighborCount(node, {
                outgoing: true,
                incoming: false,
                undirected: false
            });
        },

        outflowingNeighborCount: function (node) {
            return this.neighborCount(node, {
                outgoing: true,
                incoming: false,
                undirected: true
            });
        },

        incomingNeighborCount: function (node) {
            return this.neighborCount(node, {
                outgoing: false,
                incoming: true,
                undirected: false
            });
        },

        inflowingNeighborCount: function (node) {
            return this.neighborCount(node, {
                outgoing: false,
                incoming: true,
                undirected: true
            });
        },

        undirectedNeighborCount: function (node) {
            return this.neighborCount(node, {
                outgoing: false,
                incoming: false,
                undirected: true
            });
        },

        directedNeighborCount: function (node) {
            return this.neighborCount(node, {
                outgoing: true,
                incoming: true,
                undirected: false
            });
        },

        neighbors: function (node, opts) {
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
        },

        outgoingNeighbors: function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: true,
                    incoming: false,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        },

        outflowingNeighbors: function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: true,
                    incoming: false,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        },

        incomingNeighbors: function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: false,
                    incoming: true,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        },

        inflowingNeighbors: function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: false,
                    incoming: true,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        },

        undirectedNeighbors: function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: false,
                    incoming: false,
                    undirected: true
                },
                offset: offset,
                limit: limit
            });
        },

        directedNeighbors: function (node, offset, limit) {
            return this.neighbors(node, {
                types: {
                    outgoing: true,
                    incoming: true,
                    undirected: false
                },
                offset: offset,
                limit: limit
            });
        },

        createNode: function (data) {
            return $.when(this.createNodeRaw(data || {}))
                .then(_.bind(this.addAccessor, this));
        },

        createLink: function (source, target, _data, undirected) {
            var data;

            // If source/target is a accessor, call its key method to get the
            // key; otherwise, assume it is a string describing the key already.
            source = _.result(source, "key", source);
            target = _.result(target, "key", target);

            data = _data || {};
            undirected = _.isUndefined(undirected) ? false : undirected;

            return $.when(this.createLinkRaw(source, target, data, undirected))
                .then(_.bind(this.addAccessor, this));
        },

        destroyNode: function (node) {
            var key = node.key();
            return this.destroyNodeRaw(key).then(function (response) {
                return {
                    key: key,
                    response: response
                };
            });
        },

        destroyLink: function (link) {
            var key = link.key();
            return this.destroyLinkRaw(key).then(function (response) {
                return {
                    key: key,
                    response: response
                };
            });
        },

        // Default implementation methods.
        findNodesRaw: function () {
            throw new Error("To call findNodes(), findNode(), or findNodeByKey(), you must implement findNodesRaw()");
        },

        findLinksRaw: function () {
            throw new Error("To call findLinks(), findLink(), or findLinkByKey(), you must implement findLinksRaw()");
        },

        neighborLinksRaw: function (node, _types, offset, limit) {
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
        },

        createNodeRaw: function () {
            throw new Error("To call createNode() you must implement createNodeRaw()");
        },

        destroyNodeRaw: function () {
            throw new Error("To call destroyNode() you must implement destroyNodeRaw()");
        },

        createLinkRaw: function () {
            throw new Error("To call createLink() you must implement createLinkRaw()");
        },

        destroyLinkRaw: function () {
            throw new Error("To call destroyLink() you must implement destroyLinkRaw()");
        }
    });

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
