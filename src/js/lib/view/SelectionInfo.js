(function (cf, Backbone, _) {
    "use strict";

    cf.view.SelectionInfo = Backbone.View.extend({
        initialize: function (options) {
            if (!this.model) {
                throw cf.error.required("model");
            }

            options = options || {};
            this.graph = options.graph;

            if (!this.graph) {
                throw cf.error.required("graph");
            }

            this.listenTo(this.model, "change", this.render);
        },

        render: function () {
            var nodes = this.model.items(),
                data = _.map(nodes, this.graph.adapter.getNode, this.graph.adapter);

            this.$el.html(cf.template.selectionInfo({
                nodes: data
            }));
        }
    });
}(window.cf, window.Backbone, window._));
