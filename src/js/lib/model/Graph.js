(function (clique, Backbone, _) {
    "use strict";

    clique.Graph = Backbone.Model.extend({
        constructor: function (options) {
            Backbone.Model.call(this, {}, options || {});
        },

        initialize: function (attributes, options) {
            clique.util.require(options.adapter, "adapter");

            this.adapter = options.adapter;

            this.nodes = {};
            this.links = new clique.util.Set();

            this.forward = new clique.util.MultiTable();
            this.back = new clique.util.MultiTable();

            this.set({
                nodes: [],
                links: []
            });
        },

        addNeighborhood: function (node) {
            return this.adapter.neighbors(node).then(_.bind(function (neighbors) {
                _.map(neighbors.nodes, _.partial(this.addNode, _, neighbors.links), this);
            }));
        },

        addNode: function (node, neighborCache) {
            var request;

            // Bail if node is already in graph.
            if (_.has(this.nodes, node.key())) {
                return;
            }

            request = _.isUndefined(neighborCache) ? this.adapter.neighborLinks(node) : Backbone.$.when(neighborCache);

            // Get all neighboring links.
            request.then(_.bind(function (links) {
                var newLinks;

                // Add the node to the graph model.
                this.nodes[node.key()] = node.getRaw();

                // Filter away links not incident on nodes currently in the
                // graph.
                links = _.filter(links, function (link) {
                    return _.has(this.nodes, link.source()) && _.has(this.nodes, link.target());
                }, this);

                // Add the links to the graph.
                newLinks = _.compact(_.map(links, function (link) {
                    var key = link.key();

                    if (!this.links.has(key)) {
                        this.links.add(key);

                        this.forward.add(link.source(), link.target());

                        if (link.getAttribute("undirected")) {
                            this.back.add(link.target(), link.source());
                        }

                        link.getRaw().source = this.nodes[link.source()];
                        link.getRaw().target = this.nodes[link.target()];

                        return link.getRaw();
                    }
                }, this));

                this.set({
                    nodes: this.get("nodes").concat([node.getRaw()]),
                    links: this.get("links").concat(newLinks)
                });
            }, this));
        },

        addNodes: function (nodes) {
            var reqs = _.map(nodes, function (node) {
                this.addNode(node);
            }, this);

            return clique.util.jqSequence(reqs);
        },

        removeNode: function (node) {
            this.removeNodes([node]);
        },

        removeNodes: function (nodes) {
            var marked = new clique.util.Set(),
                newNodes,
                newLinks;

            // Mark the nodes for removal.
            marked = new clique.util.Set();
            _.each(nodes, _.bind(function (node) {
                marked.add(node);
                delete this.nodes[node];

                _.each(this.forward[node], _.bind(function (to) {
                    this.back.remove(to, node);
                }, this));

                _.each(this.back[node], _.bind(function (from) {
                    this.forward.remove(from, node);
                }, this));

                this.forward.strike(node);
                this.back.strike(node);
            }, this));

            // Copy over the nodes into a new array that omits the marked ones.
            newNodes = _.filter(this.get("nodes"), function (node) {
                return !marked.has(node.key);
            });

            // Copy over the links into a new array that omits ones involved
            // with deleted nodes.
            newLinks = [];
            _.each(this.get("links"), _.bind(function (link) {
                if (!marked.has(link.source.key) && !marked.has(link.target.key)) {
                    newLinks.push(link);
                } else {
                    this.links.remove(link.key);
                }
            }, this));

            // Set the new node and link data on the model.
            this.set({
                nodes: newNodes,
                links: newLinks
            });
        },

        inNeighbors: function (key) {
            return _.clone(this.back.items(key));
        },

        outNeighbors: function (key) {
            return _.clone(this.forward.items(key));
        },

        neighbors: function (key) {
            var inn = this.inNeighbors(key),
                outn = this.outNeighbors(key),
                nbs;

            if (_.isUndefined(inn) && _.isUndefined(outn)) {
                return undefined;
            }

            nbs = new clique.util.Set();
            _.each((inn || []).concat(outn || []), nbs.add, nbs);

            return nbs.items();
        },

        inDegree: function (key) {
            var neighbors = this.back.items(key);
            return neighbors && _.size(neighbors) || -1;
        },

        outDegree: function (key) {
            var neighbors = this.forward.items(key);
            return neighbors && _.size(neighbors) || -1;
        },

        degree: function (key) {
            var ind = this.inDegree(key),
                outd = this.outDegree(key);

            if (ind < 0 && outd < 0) {
                return -1;
            }

            return (ind < 0 ? 0 : ind) + (outd < 0 ? 0 : outd);
        }
    });
}(window.clique, window.Backbone, window._));
