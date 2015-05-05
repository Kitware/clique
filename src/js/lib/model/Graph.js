(function (clique, Backbone, _) {
    "use strict";

    clique.Graph = Backbone.Model.extend({
        constructor: function (options) {
            Backbone.Model.call(this, {}, options || {});
        },

        initialize: function (attributes, options) {
            clique.util.require(options.adapter, "adapter");

            this.adapter = new options.adapter(options.options);

            this.findNodes = _.bind(this.adapter.findNodes, this.adapter);

            this.nodes = {};
            this.links = new clique.util.Set();

            this.set("nodes", []);
            this.set("links", []);
        },

        getNeighborhood: function (options) {
            var nbd = this.adapter.neighborhood(options),
                newNodes = [],
                newLinks = [];

            _.each(nbd.nodes, _.bind(function (node) {
                if (!_.has(this.nodes, node.key)) {
                    this.nodes[node.key] = node;
                    newNodes.push(node);
                }
            }, this));

            _.each(nbd.links, _.bind(function (link) {
                var linkKey = JSON.stringify([link.source.key, link.target.key]);
                if (!this.links.has(linkKey)) {
                    this.links.add(linkKey);
                    newLinks.push(link);
                }
            }, this));

            this.set("nodes", this.get("nodes").concat(newNodes));
            this.set("links", this.get("links").concat(newLinks));
        }
    });
}(window.clique, window.Backbone, window._));
