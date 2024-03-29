var gulp = require('gulp');
var mocha = require("gulp-mocha");

gulp.task("test", function () {
    return gulp.src([
        "./tests/login.test.js",
        "./tests/clear.test.js",
        "./tests/settings.test.js",
        "./tests/content_open.test.js",
        "./tests/create_model.test.js",
        "./tests/create_content.test.js",
        "./model_add_relation.test.js",
        "./content_create2.test.js",
        "./idb.test.js",
        "./auth.test.js",
        "./misc.test.js"
    ]).pipe(mocha());
});