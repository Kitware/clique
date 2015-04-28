(function (cf) {
    "use strict";

    cf.error = {};

    cf.error.required = function (what) {
        return new Error("option '" + what + "' is required");
    };
}(window.cf));
