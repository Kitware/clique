(function (cf, Backbone, _) {
    "use strict";

    cf.view.SelectionInfo = Backbone.View.extend({
        initialize: function (options) {
            if (!this.model) {
                throw cf.error.required("model");
            }

            this.focalPoint = 0;

            options = options || {};
            this.graph = options.graph;

            if (!this.graph) {
                throw cf.error.required("graph");
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
            var nodes = this.model.items();

            if (this.focalPoint >= _.size(nodes)) {
                this.focalPoint = Math.max(0, _.size(nodes) - 1);
            }

            this.$el.html(cf.template.selectionInfo({
                node: this.graph.adapter.getNode(this.model.items()[this.focalPoint])
            }));
        }
    });
}(window.cf, window.Backbone, window._));
