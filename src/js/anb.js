/*jshint browser: true, jquery: true */
/*global clique, _, tangelo, d3, PEG */

$(function () {
    "use strict";

    var parser,
        removeAlert,
        createAlert;

    $("#add-clause").on("show.bs.modal", function () {
        var emptyQuery = _.size($("#query-string").val().trim()) === 0;

        d3.select("#clause-type")
            .style("display", emptyQuery ? "none" : null);
    });

    removeAlert = function (selector) {
        d3.select(selector)
            .selectAll(".alert.alert-danger")
            .remove();
    };

    createAlert = function (selector, message) {
        d3.select(selector)
            .append("div")
            .classed("alert", true)
            .classed("alert-danger", true)
            .classed("alert-dismissible", true)
            .classed("fade", true)
            .classed("in", true)
            .html("<a class=\"close\" data-dismiss=\"alert\">&times;</a>" + message);
    };

    $("#add").on("click", function () {
        var query = $("#query-string").val(),
            clause = $("#clause-type select").val(),
            field = $("#fieldname").val(),
            op = $("#operator").val(),
            value = $("#value").val();

        removeAlert("#errors");

        if (_.size(query.trim()) > 0 && clause === "Clause type") {
            createAlert("#errors", "You must specify a <strong>clause type</strong>!");
            return;
        }

        if (field === "") {
            createAlert("#errors", "You must specify a <strong>field name</strong>!");
            return;
        }

        if (op === "Operator") {
            createAlert("#errors", "You must specify an <strong>operator</strong>!");
            return;
        }

        switch (clause) {
        case "AND": {
            query += " & ";
            break;
        }

        case "OR": {
            query += " | ";
            break;
        }

        case "Clause type": {
            break;
        }

        default: {
            throw new Error("Impossible");
        }
        }

        query += [field, op, "\"" + value + "\""].join(" ");

        $("#query-string").val(query);
        $("#add-clause").modal("hide");
    });

    $("#submit-adv").on("click", function () {
        var query = $("#query-string").val().trim(),
            errMsg,
            result;

        // Remove any existing syntax error alert.
        removeAlert("#syntaxerror");

        // Bail if there's no query.
        if (query === "") {
            return;
        }

        // Attempt to parse the string.
        try {
            result = parser.parse(query);
        } catch (e) {
            errMsg = "line " + e.location.start.line + ", column " + e.location.start.column + ": " + e.message;
            createAlert("#syntaxerror", "<h4>Syntax error</h4> " + errMsg);
            return;
        }

        console.log(result);
    });

    var launch = function (cfg) {
        var graph,
            view,
            info,
            linkInfo;

        window.graph = graph = new clique.Graph({
            adapter: tangelo.getPlugin("mongo").Mongo,
            options: {
                host: cfg.host || "localhost",
                database: cfg.database,
                collection: cfg.collection
            }
        });

        $.getJSON("assets/tangelo/anb/get_filenames", {
            host: cfg.host,
            db: cfg.database,
            coll: cfg.collection
        }).then(function (filenames) {
            $("#filename").autocomplete({
                source: filenames,
                minLength: 0
            }).focus(function () {
                $(this).autocomplete("search", $(this).val());
            });
        });

        (function () {
            var request = null,
                action;

            action = _.debounce(function () {
                var filename = $("#filename").val();

                if (request) {
                    request.abort();
                }

                request = $.getJSON("assets/tangelo/anb/get_nodes", {
                    host: cfg.host,
                    db: cfg.database,
                    coll: cfg.collection,
                    filename: filename
                }).then(function (nodes) {
                    request = null;

                    $("#label").autocomplete({
                        source: nodes,
                        minLength: 0
                    }).focus(function () {
                        $(this).autocomplete("search", $(this).val());
                    });
                });
            }, 300);

            $("#filename").on("input", action);
            $("#filename").on("autocompleteselect", action);
        }());

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

        linkInfo = new clique.view.LinkInfo({
            model: view.linkSelection,
            el: "#link-info",
            graph: graph
        });
        linkInfo.render();
    };

    $.get("assets/query.pegjs", "text")
        .then(function (src) {
            parser = PEG.buildParser(src);
        });

    $.getJSON("anb.json")
        .then(launch, _.bind(launch, {}));
});
