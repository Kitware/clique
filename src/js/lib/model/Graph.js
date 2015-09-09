(function (clique, Backbone, _) {
    "use strict";

    clique.Graph = Backbone.Model.extend({
        constructor: function (options) {
            Backbone.Model.call(this, {}, options || {});
        },

        initialize: function (attributes, options) {
            clique.util.require(options.adapter, "adapter");

            this.adapter = new options.adapter(options.options);

            this.nodes = {};
            this.links = new clique.util.Set();

            this.forward = new clique.util.MultiTable();
            this.back = new clique.util.MultiTable();

            this.set({
                nodes: [],
                links: []
            });
        },

        addNeighborhood: function (options) {
            return this.adapter.neighborhood(options)
                .then(_.bind(function (nbd) {
                    var newNodes = [],
                        newLinks = [];

                    _.each(nbd.nodes, _.bind(function (node) {
                        if (!_.has(this.nodes, node.key)) {
                            this.nodes[node.key] = node;
                            newNodes.push(node);
                        }
                    }, this));

                    _.each(nbd.links, _.bind(function (link) {
                        var linkKey = clique.util.linkHash(link);
                        if (!this.links.has(linkKey)) {
                            this.links.add(linkKey);

                            this.forward.add(link.source, link.target);
                            this.back.add(link.target, link.source);

                            link.source = this.nodes[link.source];
                            link.target = this.nodes[link.target];

                            newLinks.push(link);
                        }
                    }, this));

                    this.set({
                        nodes: this.get("nodes").concat(newNodes),
                        links: this.get("links").concat(newLinks)
                    });
                }, this));
        },

        addNode: function (node) {
            return this.adapter.neighborhood({
                center: node,
                radius: 1
            }).then(_.bind(function (nbd) {
                var newLinks = [];

                if (!_.has(this.nodes, node.key())) {
                    this.nodes[node.key()] = node.getTarget();
                }

                _.each(nbd.links, _.bind(function (link) {
                    var linkKey = clique.util.linkHash(link);
                    if (!this.links.has(linkKey) && _.has(this.nodes, link.source) && _.has(this.nodes, link.target)) {
                        this.links.add(linkKey);

                        this.forward.add(link.source, link.target);
                        this.back.add(link.target, link.source);

                        link.source = this.nodes[link.source];
                        link.target = this.nodes[link.target];

                        newLinks.push(link);
                    }
                }, this));

                this.set({
                    nodes: this.get("nodes").concat([node.getTarget()]),
                    links: this.get("links").concat(newLinks)
                });
            }, this));
        },

        removeNeighborhood: function (options) {
            var center,
                radius,
                frontier,
                neighborhood,
                marked,
                newNodes,
                newLinks;

            options = options || {};
            center = options.center;
            radius = options.radius;

            clique.util.require(center, "center");
            clique.util.require(radius, "radius");

            // Compute the set of nodes that lie within the requested
            // neighborhood of the central node.
            neighborhood = new clique.util.Set();
            neighborhood.add(center.key());

            frontier = new clique.util.Set();
            frontier.add(center.key());

            _.each(_.range(radius), _.bind(function () {
                var newFrontier = new clique.util.Set();

                // Collect the outgoing and incoming nodes for each node in the
                // frontier.
                _.each(frontier.items(), _.bind(function (key) {
                    var forward = this.forward.items(key) || [],
                        back = this.back.items(key) || [];

                    _.each(forward.concat(back), function (neighbor) {
                        newFrontier.add(neighbor);
                        neighborhood.add(neighbor);
                    });
                }, this));

                frontier = newFrontier;
            }, this));

            // Mark for removal the neighborhood nodes from the node list.
            marked = new clique.util.Set();
            _.each(neighborhood.items(), _.bind(function (node) {
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
                    this.links.remove(clique.util.linkHash(link));
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
