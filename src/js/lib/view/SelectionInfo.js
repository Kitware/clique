(function (clique, Backbone, _, d3) {
    "use strict";

    clique.view.SelectionInfo = Backbone.View.extend({
        initialize: function (options) {
            if (!this.model) {
                throw clique.error.required("model");
            }

            this.focalPoint = 0;

            options = options || {};
            this.graph = options.graph;

            if (!this.graph) {
                throw clique.error.required("graph");
            }

            this.listenTo(this.model, "change", this.render);
        },

        focus: function (target) {
            this.focalPoint = target;
            this.render();
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

        render: function () {
            var nodes = this.model.items(),
                node,
                that = this;

            if (this.focalPoint >= _.size(nodes)) {
                this.focalPoint = Math.max(0, _.size(nodes) - 1);
            }

            node = this.graph.adapter.getNode(this.model.items()[this.focalPoint]);

            this.trigger("focus", node && node.key || undefined);

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
        }
    });
}(window.clique, window.Backbone, window._, window.d3));
