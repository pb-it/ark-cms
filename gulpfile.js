var gulp = require('gulp');
var mocha = require("gulp-mocha");

gulp.task("test", function () {
    return gulp.src([
        "./tests/login.test.js",
        "./tests/create_model.test.js"
    ])
        .pipe(mocha());
});