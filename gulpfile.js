/*jshint node: true */

var gulp = require("gulp"),
    concat = require("gulp-concat"),
    gutil = require("gulp-util"),
    jade = require("gulp-jade"),
    jscs = require("gulp-jscs"),
    stylishJscs = require("gulp-jscs-stylish"),
    job = require("gulp-job"),
    jshint = require("gulp-jshint"),
    plumber = require("gulp-plumber"),
    rename = require("gulp-rename"),
    rimraf = require("gulp-rimraf"),
    stylus = require("gulp-stylus"),
    uglify = require("gulp-uglify"),
    stylishJshint = require("jshint-stylish"),
    _ = require("underscore");

(function () {
    "use strict";

    var gulpSrc = gulp.src;
    gulp.src = function () {
        return gulpSrc.apply(gulp, arguments)
            .pipe(plumber(function (error) {
                gutil.log(gutil.colors.red("Error (" + error.plugin + "): " + error.message));
                this.emit("end");
            }));
    };
}());

gulp.task("jade", function () {
    "use strict";

    return gulp.src("src/jade/*.jade")
        .pipe(jade())
        .pipe(gulp.dest("./build/site"));
});

gulp.task("jade-templates", function () {
    "use strict";

    return gulp.src("src/jade/template/**/*.jade")
        .pipe(jade({
            client: true
        }))
        .pipe(job({
            namespace: "cf.template"
        }))
        .pipe(concat("templates.js"))
        .pipe(gulp.dest("./build/jade"));
});

gulp.task("stylus", function () {
    "use strict";

    return gulp.src("src/styl/**/*.styl")
        .pipe(stylus({
            compress: true
        }))
        .pipe(gulp.dest("./build/site"));
});

gulp.task("uglify-index", function () {
    "use strict";

    var dest = _.bind(gulp.dest, gulp, "build/site");

    return gulp.src("src/js/index.js")
        .pipe(dest())
        .pipe(uglify())
        .pipe(rename("index.min.js"))
        .pipe(dest());
});

gulp.task("uglify-cliquefix", function () {
    "use strict";

    var dest = _.bind(gulp.dest, gulp, "build/site");

    return gulp.src([
        "node_modules/jshashes/hashes.js",
        "node_modules/jade/runtime.js",
        "src/js/lib/preamble.js",
        "build/jade/templates.js",
        "src/js/lib/error.js",
        "src/js/lib/**/*.js"
    ])
        .pipe(concat("cliquefix.js"))
        .pipe(dest())
        .pipe(uglify())
        .pipe(rename("cliquefix.min.js"))
        .pipe(dest());
});

gulp.task("lint", function () {
    "use strict";

    return gulp.src([
        "src/js/**/*.js",
        "gulpfile.js"
    ])
        .pipe(jshint())
        .pipe(jshint.reporter(stylishJshint))
        .pipe(jshint.reporter("fail"));
});

gulp.task("style", function () {
    "use strict";

    return gulp.src([
        "src/js/**/*.js",
        "gulpfile.js"
    ])
        .pipe(jscs())
        .pipe(stylishJscs());
});

gulp.task("clean", function () {
    "use strict";

    return gulp.src("./build/**", { read: false })
        .pipe(rimraf());
});

gulp.task("uglify", [
    "jade-templates",
    "uglify-index",
    "uglify-cliquefix"
]);

gulp.task("default", [
    "lint",
    "style",
    "stylus",
    "uglify",
    "jade"
]);
