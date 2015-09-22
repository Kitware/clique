/*jshint browser: true, jquery: true */
/*global app, clique, _ */

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

    graphData = randomGraph(26, 0.20);
    graph = new clique.Graph({
        adapter: clique.adapter.NodeLinkList,
        options: graphData
    });

    $("#seed").on("click", function () {
        var name = $("#name").val().trim(),
            spec,
            radiusText = $("#radius").val().trim(),
            radius = Number(radiusText),
            delsearch = $("#delsearch").prop("checked");

        if (name === "" || radiusText === "" || isNaN(radius)) {
            return;
        }

        spec = {
            queryOp: "==",
            field: "name",
            value: name
        };
        graph.adapter.findNode(spec)
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

    view = new clique.view.Cola({
        model: graph,
        el: "#content"
    });

    info = new app.view.SelectionInfo({
        model: view.selection,
        el: "#info",
        graph: graph
    });
    info.render();
});
