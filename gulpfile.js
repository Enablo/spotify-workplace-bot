const gulp = require('gulp');
const eslint = require('gulp-eslint');

gulp.task('lint', () => {
    return gulp.src(['lib/**', 'models/**', 'routes/**', 'service/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('default', ['lint'], () => {});