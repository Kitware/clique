(function (cf, Hashes) {
    "use strict";

    cf.util = {};

    cf.util.md5 = (function () {
        var md5 = new Hashes.MD5();

        return function (s) {
            return md5.hex(s);
        };
    }());
}(window.cf, window.Hashes));
