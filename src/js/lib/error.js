(function (clique) {
    "use strict";

    clique.error = {};

    clique.error.required = function (what) {
        return new Error("option '" + what + "' is required");
    };
}(window.clique));
