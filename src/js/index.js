/*jshint browser: true, jquery: true */
/*global clique, _ */

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

    var graphData,
        graph,
        view,
        info;

    window.graphData = graphData = randomGraph(26, 0.20);

    window.graph = graph = new clique.Graph({
        adapter: clique.adapter.NodeLinkList,
        options: graphData
    });

    $("#seed").on("click", function () {
        var name = $("#name").val().trim(),
            radiusText = $("#radius").val().trim(),
            radius = Number(radiusText),
            delsearch = $("#delsearch").prop("checked"),
            center;

        if (name === "" || radiusText === "" || isNaN(radius)) {
            return;
        }

        center = graph.adapter.findNode({
            name: name
        });

        if (center) {
            graph.addNeighborhood({
                center: center,
                radius: radius,
                deleted: delsearch
            });
        }
    });

    $("#save").on("click", function () {
        graph.adapter.write();
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
});
