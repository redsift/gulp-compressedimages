
var map = require('map-stream'),
    gutil = require('gulp-util'),
    im = require('gm').subClass({ imageMagick : true }),
    fs = require('fs'),
    path = require('path');

var sRGB = 'sRGB_v4_ICC_preference.icc';
var PLUGIN_NAME = 'gulp-compressedimages';

function commonImageOptions(gmfile, profile) {
    return gmfile.intent('Perceptual')
                .profile(profile)
                .strip()
                .gamma(0.454545).bitdepth(16);
}

function jpegImageOptions(gmfile) {
    return gmfile.interlace('Plane')
                .flatten();
}

function webpImageOptions(gmfile) {
    return gmfile.define('webp:auto-filter=true')
                .define('webp:method=6')
                .define('webp:image-hint=photo')
                .define('webp:partitions=0') 
                .define('webp:preprocessing=2') 
                .define('webp:sns-strength=0');
}

var common = [ 
        {
            size: 256,
            quality: 10,
            suffix: '_0x',
            blur: 1.1
        },
        {
            size: 512,
            quality: 90,
            suffix: '_05x',
            unsharp: [ 4, 1.4, 0.7, 0 ]
        },
        {
            size: 1024,
            quality: 90,
            unsharp: [ 3, 0.6, 0.7, 0 ]
        },  
        {
            size: 2048,
            quality: 92,
            suffix: '_2x'
        },  
        {
            size: 512,
            quality: 90,
            suffix: '_05x',
            unsharp: [ 4, 1.4, 0.7, 0 ],
            webp: true
        },
        {
            size: 1024,
            quality: 90,
            unsharp: [ 3, 0.6, 0.7, 0 ],
            webp: true
        },  
        {
            size: 2048,
            quality: 92,
            suffix: '_2x',
            webp: true
        }  
];

function resampler(opts) {
    opts = opts || {};

    var iccProfile = opts.iccProfile || './' + sRGB;

    var webp = opts.webp != null ? opts.webp : false;
    
    var size = opts.size || 0;
    var quality = opts.quality || 0;
    var suffix = opts.suffix || '';
    var unsharp = opts.unsharp;
    var blur = opts.blur || 0;

    return map(function(originalFile, done) {
        var file = originalFile.clone({contents: false});

        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            return done(new gutil.PluginError(PLUGIN_NAME, "Streaming not supported"));
        }

        try {
            // do this check as if not present, the ICC profile failure is silent
            fs.accessSync(iccProfile, fs.F_OK);
        } catch (e) {
            if (opts.iccProfile) {
                return done(new gutil.PluginError(PLUGIN_NAME, e), null);
            }
            return done(new gutil.PluginError(PLUGIN_NAME, 'Please download the official sRGB ICC profile "' + sRGB + '" from http://www.color.org/srgbprofiles.xalter and place in this directory'), null);
        }

        var imFile = im(file.contents, file.path);
        imFile = commonImageOptions(imFile, iccProfile);

        if (webp) {
            imFile = webpImageOptions(imFile);
        } else {
            imFile = jpegImageOptions(imFile);
        }
        
        if (size !== 0) {
            imFile = imFile.resize(size);
        }

        if (unsharp) {
            imFile = imFile.unsharp.apply(imFile, unsharp);
        } else if (blur > 0) {
            imFile = imFile.blur(blur);
        }

        imFile = imFile.gamma(2.2).bitdepth(8);
        
        imFile.setFormat(webp ? 'webp' : 'jpg');

        if (quality) {
            imFile = imFile.quality(quality);
        }
 
        imFile.toBuffer(function (err, buffer) {
          if (err) {
            return done(new gutil.PluginError(PLUGIN_NAME, 'Could not process "' + file.path + '" as a ' + imFile._outputFormat + '. ' + err));
          } else {
            if (imFile._outputFormat) {
              file.path = file.path.replace(path.extname(file.path), suffix + '.' + imFile._outputFormat);
            }
            file.contents = buffer;
            done(null, file);
          }
        });        
    });
}

module.exports = { resampler: resampler, common: common };
