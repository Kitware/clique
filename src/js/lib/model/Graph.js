(function (clique, Backbone, _) {
    "use strict";

    var linkHash = function (link) {
        var source,
            target;

        source = link.source;
        if (!_.isString(source)) {
            source = source.key;
        }

        target = link.target;
        if (!_.isString(target)) {
            target = target.key;
        }

        return JSON.stringify([source, target]);
    };

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
            this.adapter.neighborhood(options, _.bind(function (nbd) {
                var newNodes = [],
                    newLinks = [];

                _.each(nbd.nodes, _.bind(function (node) {
                    if (!_.has(this.nodes, node.key)) {
                        this.nodes[node.key] = node;
                        newNodes.push(node);
                    }
                }, this));

                _.each(nbd.links, _.bind(function (link) {
                    var linkKey = linkHash(link);
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
            neighborhood.add(center.key);

            frontier = new clique.util.Set();
            frontier.add(center.key);

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
                    this.links.remove(linkHash(link));
                }
            }, this));

            // Set the new node and link data on the model.
            this.set({
                nodes: newNodes,
                links: newLinks
            });
        }
    });
}(window.clique, window.Backbone, window._));
