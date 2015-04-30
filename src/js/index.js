/*jshint browser: true, jquery: true */
/*global cf */

$(function () {
    "use strict";

    var graph,
        view;

    $("#content").html("<p>Hello</p>");

    window.graph = graph = new cf.Graph({
        adapter: cf.adapter.NodeLinkList,
        options: {
            nodes: [
                {name: "a"},
                {name: "b"},
                {name: "c"},
                {name: "d"},
                {name: "e"},
                {name: "f"}
            ],
            links: [
                {source: 0, target: 2},
                {source: 0, target: 4},
                {source: 0, target: 5},
                {source: 1, target: 4},
                {source: 2, target: 3},
                {source: 2, target: 4},
                {source: 3, target: 0},
                {source: 3, target: 5},
                {source: 5, target: 4}
            ]
        }
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
