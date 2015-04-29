(function (cf, Backbone, _) {
    "use strict";

    cf.view.Cola = Backbone.View.extend({
        initialize: function () {
            if (!this.model) {
                throw cf.error.required("model");
            }

            if (!this.el) {
                throw cf.error.required("el");
            }

            this.$el.html(cf.template.cola());
            this.listenTo(this.model, "change", this.render);
        },

        render: function () {
            var nodes;

            nodes = d3.select(this.el)
                .select("g.nodes")
                .selectAll("circle.node")
                .data(this.model.get("nodes"), _.property("key"));

            nodes.enter()
                .append("circle")
                .classed("node", true)
                .attr("r", 0)
                .transition()
                .duration(500)
                .attr("r", 10);
        }
    });
}(window.cf, window.Backbone, window._));
