/*jshint browser: true, jquery: true */
/*global clique, _, tangelo */

$(function () {
    "use strict";

    var launch = function (cfg) {
        var graph,
            view,
            info;

        window.graph = graph = new clique.Graph({
            adapter: tangelo.getPlugin("mongo").Mongo,
            options: {
                host: cfg.host || "localhost",
                database: cfg.database,
                collection: cfg.collection
            }
        });

        $("#submit").on("click", function () {
            var label = $("#label").val().trim(),
                filename = $("#filename").val().trim(),
                spec = {},
                delsearch = $("#delsearch").prop("checked");

            if (label === "" && filename === "") {
                return;
            }

            if (filename) {
                spec.filename = filename;
            }

            if (label) {
                spec.label = label;
            }

            graph.adapter.findNode(spec)
                .then(function (center) {
                    console.log(center);
                    if (center) {
                        graph.addNode(center);
                    }
                });
        });

        window.view = view = new clique.view.Cola({
            model: graph,
            el: "#content"
        });

        window.info = info = new clique.view.SelectionInfo({
            model: view.selection,
            el: "#info",
            graph: graph
        });
        info.render();
    };

    $.getJSON("anb.json").then(launch, _.bind(launch, {}));
});
