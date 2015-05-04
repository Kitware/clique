(function () {
    "use strict";

    var oldClique,
        clique;

    // Save old value of clique, just in case.
    oldClique = window.clique;

    // Establish a namespace for Clique.
    clique = window.clique = {};

    // Return the old value to the previous owner.
    clique.noConflict = function () {
        var handle = clique;
        clique = oldClique;
        return handle;
    };

    // Namespaces.
    clique.model = {};
    clique.view = {};
}());
