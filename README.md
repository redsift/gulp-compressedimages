# gulp-compressedimages

[![Circle CI](https://img.shields.io/circleci/project/redsift/gulp-compressedimages.svg?style=flat-square)](https://circleci.com/gh/redsift/gulp-compressedimages)
[![npm](https://img.shields.io/npm/v/@redsift/gulp-compressedimages.svg?style=flat-square)](https://www.npmjs.com/package/@redsift/gulp-compressedimages)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/redsift/gulp-compressedimages/master/LICENSE)

Processes images with ImageMagick to resize and compress them carefully as JPEG or WEBP files.

## Installation

`gulp-compressedimages` requires ImageMagick (tested with ImageMagick 6.9.2) compiled with the jpeg, lcms and webp delegates.

Verify this via `convert -version`. If you receive a `Stream yields empty buffer` error while reading or writing WEBP, most likely your ImageMagick binary was not built with WEBP support.

Running the pipe will also typically require an sRGB ICC profile [downloaded locally](http://www.color.org/srgbprofiles.xalter) to correctly perform the color conversion.

## Usage

`require('gulp-compressedimages').resampler` can be used in the gulp stream to process images.

```js
// Multiple files to an auto compressed JPEG
var gulp = require('gulp'),
    photos = require('@redsift/gulp-compressedimages');

gulp.task('images', function() {
    return gulp.src([ 'photo1.jpg', ... ])
        .pipe(photos.resampler({ size: 200 }))
        .pipe(gulp.dest('dist/'));
});
```

```js
// Multiple files to a heavily compressed WebP
var gulp = require('gulp'),
    photos = require('@redsift/gulp-compressedimages');

gulp.task('images', function() {
    return gulp.src([ 'photo1.jpg', ... ])
        .pipe(photos.resampler({ size: 200, webp: true, quality: 50 }))
        .pipe(gulp.dest('dist/'));
});
```

## Usage - Standard Sizes

`require('gulp-compressedimages').common` provides a list of standard sizes to generate asset files for common use.

The common sizes also have small amounts of sharpening built into the pipeline and are best served by processing original assets at original (> 3000 pixels) resolutions.

```js
var gulp = require('gulp'),
    photos = require('@redsift/gulp-compressedimages'),
    merge = require('merge-stream');

gulp.task('common', function() {
    var all = photos.common.map(function (o) {
        return gulp.src('photo.jpg')
            .pipe(photos.resampler(o))
            .pipe(gulp.dest('dist/'));
    });

    return merge.apply(this, all);
});
```

## Stripping

This plugin strips color profiles and comments to reduce image size.

## Colorspace conversion

As a result of stripping profiles, the image needs to be converted to sRGB. If required, the plugin with change the colorspace with a Perceptual intent.

## Gamma correct scaling

The scaling operations are done in a linear manner to avoid scaling errors. Reference [this article](http://www.4p8.com/eric.brasseur/gamma.html) for the issues addressed.
