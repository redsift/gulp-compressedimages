'use strict';

var gulp = require('gulp'),
    photos = require('../'),
    imageDiff = require('image-diff'),
    merge = require('merge-stream');

var testOutput = process.env.CIRCLE_ARTIFACTS || '_out/';

gulp.task('broken', function() {
    return gulp.src('broken.jpg')
        .pipe(photos.resampler({ iccProfile: '_out/srgb.icc' }))
        .pipe(gulp.dest(testOutput));
});

gulp.task('webp', function() {
    return gulp.src('test-icc.jpg')
        .pipe(photos.resampler({ iccProfile: '_out/srgb.icc', size: 200, webp: true, suffix: '_d', quality: 50 }))
        .pipe(gulp.dest(testOutput));
});

gulp.task('gamma', function() {
    return gulp.src([ 'test-gray.jpg', 'test-gray-tft.jpg' ])
        .pipe(photos.resampler({ iccProfile: '_out/srgb.icc', size: 200, suffix: '_g' }))
        .pipe(gulp.dest(testOutput));
});

gulp.task('common', function() {
    var all = photos.common.map(function (o) {
        o.iccProfile = '_out/srgb.icc';

        return gulp.src('test-icc.jpg')
            .pipe(photos.resampler(o))
            .pipe(gulp.dest(testOutput));
    });

    return merge.apply(this, all);
});

gulp.task('validate', [ 'webp', 'gamma', 'common' ], function() {

    imageDiff.getFullResult({
        actualImage: testOutput + '/test-icc_d.webp',
        expectedImage: 'ref-icc.webp',
        diffImage: testOutput + '/diff.png',
    }, 
    function (err, delta) {
        if (err) throw err;

        if (delta.percentage > 0.02) {
            throw new Error('Transformed image did not match the reference image by ' + (delta.percentage * 100) + '%. Likely color management is not enabled in the Imagemagick binary');
        }
    });    
});    

gulp.task('default', [ 'validate' ])