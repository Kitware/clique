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
        view,
        info;

    graphData = randomGraph(26, 0.20);

    window.graph = graph = new cf.Graph({
        adapter: cf.adapter.NodeLinkList,
        options: graphData
    });

    $("#seed").on("click", function () {
        var name = $("#name").val().trim(),
            radiusText = $("#radius").val().trim(),
            radius = Number(radiusText),
            center;

        if (name === "" || radiusText === "" || isNaN(radius)) {
            return;
        }

        center = graph.findNodes({
            name: name
        })[0];

        if (center) {
            graph.getNeighborhood({
                center: center,
                radius: radius
            });
        }
    });

    window.view = view = new cf.view.Cola({
        model: graph,
        el: "#content"
    });
    view.render();

    window.info = info = new cf.view.SelectionInfo({
        model: view.selection,
        el: "#info",
        graph: graph
    });
    info.render();

    view.listenTo(info, "focus", function (key) {
        view.focused = key;
        view.render();
    });
});
