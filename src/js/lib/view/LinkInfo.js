(function (clique, Backbone, _) {
    "use strict";

    clique.view.LinkInfo = Backbone.View.extend({
        initialize: function (options) {
            options = options || {};
            this.graph = options.graph;

            clique.util.require(this.model, "model");
            clique.util.require(this.graph, "graph");

            this.listenTo(this.model, "focused", _.debounce(this.render, 100));
        },

        render: function () {
            var source,
                target,
                text,
                key,
                doRender;

            doRender = _.bind(function (link) {
                this.$el.html(clique.template.linkInfo({
                    link: link
                }));
            }, this);

            text = this.model.focused();
            if (!text) {
                doRender(undefined);
            } else {
                key = JSON.parse(text);
                source = key[0];
                target = key[1];

                this.graph.adapter.findLink({
                    source: source,
                    target: target
                }).then(doRender);
            }
        }
    });
}(window.clique, window.Backbone, window._));
