(function (clique, Backbone, _) {
    "use strict";

    clique.view.LinkInfo = Backbone.View.extend({
        initialize: function (options) {
            var debRender;

            options = options || {};
            this.graph = options.graph;

            clique.util.require(this.model, "model");
            clique.util.require(this.graph, "graph");

            debRender = _.debounce(this.render, 100);

            this.listenTo(this.model, "focused", debRender);
            this.listenTo(this.model, "focused", debRender);
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

                this.$("a.prev").on("click", _.bind(function () {
                    this.model.focusLeft();
                }, this));

                this.$("a.next").on("click", _.bind(function () {
                    this.model.focusRight();
                }, this));
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
