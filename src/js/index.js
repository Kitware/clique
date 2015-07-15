/*jshint browser: true, jquery: true */
/*global clique, _, tangelo */

function randomGraph(n, pct) {
    "use strict";

    var alphabet = "abcdefghijklmnopqrstuvwxyz",
        nodes = [],
        links = [];

    _.each(_.range(n), function (i) {
        nodes.push({
            name: alphabet[i]
        });
    });

    _.each(_.range(n), function (source, i) {
        _.each(_.range(i + 1, n), function (target) {
            if (Math.random() < pct) {
                links.push({
                    source: source,
                    target: target
                });
            }
        });
    });

    return {
        nodes: nodes,
        links: links
    };
}

$(function () {
    "use strict";

    var launch = function (cfg) {
        var graphData,
            graph,
            view,
            mode,
            info;

        mode = tangelo.queryArguments().mode || "mongo-xdata";

        switch (mode) {
        case "mongo-xdata": {
            window.graph = graph = new clique.Graph({
                adapter: tangelo.getPlugin("mongo-xdata").MongoXdata,
                options: {
                    host: cfg.host || "localhost",
                    database: cfg.database || "year3_graphs",
                    collection: cfg.collection || "mentions_monica_nino_2hop_mar12"
                }
            });
            break;
        }

        default: {
            graphData = randomGraph(26, 0.20);

            window.graph = graph = new clique.Graph({
                adapter: clique.adapter.NodeLinkList,
                options: graphData
            });
            break;
        }
        }

        $("#seed").on("click", function () {
            var name = $("#name").val().trim(),
                radiusText = $("#radius").val().trim(),
                radius = Number(radiusText),
                delsearch = $("#delsearch").prop("checked");

            if (name === "" || radiusText === "" || isNaN(radius)) {
                return;
            }

            graph.adapter.findNode({name: name})
                .then(function (center) {
                    if (center) {
                        graph.addNeighborhood({
                            center: center,
                            radius: radius,
                            deleted: delsearch
                        });
                    }
                });
        });

        $("#save").on("click", function () {
            graph.adapter.sync();
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

    $.getJSON("clique.yaml").then(launch, _.bind(launch, {}));
});
