/*jshint browser: true, jquery: true */
/*global cf, _ */

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
        view;

    graphData = randomGraph(26, 0.20);

    window.graph = graph = new cf.Graph({
        adapter: cf.adapter.NodeLinkList,
        options: graphData
    });

    $("#nbd-b").on("click", function () {
        var center = graph.findNodes({
            name: "b"
        });

        graph.getNeighborhood({
            center: center[0],
            radius: 1
        });

        $(this).attr("disabled", true);
    });

    $("#nbd-c").on("click", function () {
        var center = graph.findNodes({
            name: "c"
        });

        graph.getNeighborhood({
            center: center[0],
            radius: 1
        });

        $(this).attr("disabled", true);
    });

    view = new cf.view.Cola({
        model: graph,
        el: "#content"
    });
    view.render();
});
