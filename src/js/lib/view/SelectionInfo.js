(function (clique, Backbone, _, d3) {
    "use strict";

    clique.view.SelectionInfo = Backbone.View.extend({
        initialize: function (options) {
            clique.util.require(this.model, "model");
            clique.util.require(options.graph, "graph");

            this.focalPoint = 0;

            options = options || {};
            this.graph = options.graph;

            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.graph, "change", this.render);
        },

        focus: function (target) {
            this.focalPoint = target;
            this.render();
            this.trigger("nodefocus", this.focusNode());
        },

        focusRight: function () {
            if (this.focalPoint < _.size(this.model.attributes) - 1) {
                this.focus(this.focalPoint + 1);
            }
        },

        focusLeft: function () {
            if (this.focalPoint > 0) {
                this.focus(this.focalPoint - 1);
            }
        },

        focusNode: function () {
            return this.graph.adapter.findNode({
                key: this.model.items()[this.focalPoint]
            });
        },

        render: function () {
            var nodes = this.model.items(),
                node,
                that = this;

            if (this.focalPoint >= _.size(nodes)) {
                this.focalPoint = Math.max(0, _.size(nodes) - 1);
            }

            node = this.focusNode();

            this.$el.html(clique.template.selectionInfo({
                node: node
            }));

            d3.select(this.el)
                .select("li.prev")
                .classed("disabled", this.focalPoint === 0);

            this.$("a.prev")
                .on("click", function () {
                    that.focusLeft();
                });

            d3.select(this.el)
                .select("li.next")
                .classed("disabled", this.focalPoint === _.size(nodes) - 1);

            this.$("a.next")
                .on("click", function () {
                    that.focusRight();
                });

            this.$("button.remove").on("click", _.bind(function () {
                this.graph.removeNeighborhood({
                    center: this.focusNode(),
                    radius: 0
                });
            }, this));
        }
    });
}(window.clique, window.Backbone, window._, window.d3));
