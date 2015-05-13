(function (clique, Backbone, _, d3) {
    "use strict";

    clique.view.SelectionInfo = Backbone.View.extend({
        initialize: function (options) {
            clique.util.require(this.model, "model");
            clique.util.require(options.graph, "graph");

            options = options || {};
            this.graph = options.graph;

            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "focused", this.render);
            this.listenTo(this.graph, "change", this.render);
        },

        hideNode: function (node) {
            this.graph.removeNeighborhood({
                center: node,
                radius: 0
            });
        },

        expandNode: function (node) {
            this.graph.addNeighborhood({
                center: node,
                radius: 1
            });
        },

        render: function () {
            var node = this.graph.adapter.findNode({
                key: this.model.focused()
            });

            this.$el.html(clique.template.selectionInfo({
                node: node,
                selectionSize: this.model.size()
            }));

            d3.select(this.el)
                .select("li.prev")
                .classed("disabled", this.model.focalPoint === 0);

            this.$("a.prev")
                .on("click", _.bind(function () {
                    this.model.focusLeft();
                }, this));

            d3.select(this.el)
                .select("li.next")
                .classed("disabled", this.model.focalPoint === _.size(this.model.attributes) - 1);

            this.$("a.next")
                .on("click", _.bind(function () {
                    this.model.focusRight();
                }, this));

            this.$("button.remove").on("click", _.bind(function () {
                this.hideNode(this.graph.adapter.findNode({
                    key: this.model.focused()
                }));
            }, this));

            this.$("button.remove-sel").on("click", _.bind(function () {
                _.each(this.model.items(), _.bind(function (key) {
                    this.hideNode(this.graph.adapter.findNode({
                        key: key
                    }));
                }, this));
            }, this));

            this.$("button.expand").on("click", _.bind(function () {
                this.expandNode(this.graph.adapter.findNode({
                    key: this.model.focused()
                }));
            }, this));

            this.$("button.expand-sel").on("click", _.bind(function () {
                _.each(this.model.items(), _.bind(function (key) {
                    this.expandNode(this.graph.adapter.findNode({
                        key: key
                    }));
                }, this));
            }, this));
        }
    });
}(window.clique, window.Backbone, window._, window.d3));
