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
            node.selected = false;
            delete node.root;
            this.graph.removeNeighborhood({
                center: node,
                radius: 0
            });
        },

        deleteNode: function (node, deleted) {
            node.deleted = deleted;

            if (node.deleted) {
                this.hideNode(node);
            } else {
                delete node.deleted;
                this.render();
            }
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

            this.$("button.delete").on("click", _.bind(function () {
                var node = this.graph.adapter.findNode({
                    key: this.model.focused()
                });
                this.deleteNode(node, !node.deleted);
            }, this));

            this.$("button.delete-sel").on("click", _.bind(function () {
                _.each(this.model.items(), _.bind(function (key) {
                    this.deleteNode(this.graph.adapter.findNode({
                        key: key
                    }), true);
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
