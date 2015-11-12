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

    graphData = randomGraph(26, 0.20);
    graph = new clique.Graph({
        adapter: new clique.adapter.NodeLinkList(graphData)
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
            name: name
        };
        graph.adapter.findNode(spec)
            .then(function (center) {
                if (center) {
                    graph.addNeighborhood(center, radius);
                }
            });
    });

    view = new clique.view.Cola({
        model: graph,
        el: "#content",
        fill: function (d) {
            var colors = [
                "rgb(166,206,227)",
                "rgb(31,120,180)",
                "rgb(178,223,138)",
                "rgb(51,160,44)",
                "rgb(251,154,153)",
                "rgb(227,26,28)",
                "rgb(253,191,111)",
                "rgb(255,127,0)",
                "rgb(202,178,214)",
                "rgb(106,61,154)",
                "rgb(255,255,153)",
                "rgb(177,89,40)"
            ];

            return colors[(d.data.name.codePointAt(0) - "a".codePointAt(0)) % colors.length];
        }
    });

    info = new clique.view.SelectionInfo({
        model: view.selection,
        el: "#info",
        graph: graph,
        nodeButtons: [
            {
                label: "Hide",
                color: "purple",
                icon: "eye-close",
                callback: function (node) {
                    _.bind(clique.view.SelectionInfo.hideNode, this)(node);
                }
            },
            {
                label: function (node) {
                    return node.getData("deleted") ? "Undelete" : "Delete";
                },
                color: "red",
                icon: "remove",
                callback: function (node) {
                    _.bind(clique.view.SelectionInfo.deleteNode, this)(node);
                }
            },
            {
                label: "Ungroup",
                color: "blue",
                icon: "scissors",
                callback: function (node) {
                    console.log(node);
                },
                show: function (node) {
                    return node.getData("grouped");
                }

            },
            {
                label: "Expand",
                color: "blue",
                icon: "fullscreen",
                callback: function (node) {
                    _.bind(clique.view.SelectionInfo.expandNode, this)(node);
                }
            },
            {
                label: "Collapse",
                color: "blue",
                icon: "resize-small",
                callback: function (node) {
                    _.bind(clique.view.SelectionInfo.collapseNode, this)(node);
                }
            }
        ],
        selectionButtons: [
            {
                label: "Hide",
                color: "purple",
                icon: "eye-close",
                repeat: true,
                callback: function (node) {
                    _.bind(clique.view.SelectionInfo.hideNode, this)(node);
                }
            },
            {
                label: "Delete",
                color: "red",
                icon: "remove",
                repeat: true,
                callback: function (node) {
                    return _.bind(clique.view.SelectionInfo.deleteNode, this)(node);
                }
            },
            {
                label: "Expand",
                color: "blue",
                icon: "fullscreen",
                repeat: true,
                callback: function (node) {
                    _.bind(clique.view.SelectionInfo.expandNode, this)(node);
                }
            },
            {
                label: "Collapse",
                color: "blue",
                icon: "resize-small",
                repeat: true,
                callback: function (node) {
                    _.bind(clique.view.SelectionInfo.collapseNode, this)(node);
                }
            }
        ]
    });
    info.render();
});
