(function () {
    "use strict";

    var oldCf,
        cf;

    // Save old value of cf, just in case.
    oldCf = window.cf;

    // Establish a namespace for cliquefix.
    cf = window.cf = {};

    // Return the old value to the previous owner.
    cf.noConflict = function () {
        var handle = cf;
        cf = oldCf;
        return handle;
    };

    // Namespace for views.
    cf.view = {};
}());
