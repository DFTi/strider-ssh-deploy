var _ = require('lodash');
var fs = require('fs');

module.exports = {
  // This is how you would bundle a NODE.JS project...
  bundleProject: function(dataDir, name, progress, done) {
    var bundlePath = '/tmp/'+name+'.tar.gz';
    var progstream = require('progress-stream');
    progressEmitter = progstream({ time:1000 });
    progressEmitter.on('progress', progress);
    require('npmd-pack')(dataDir, {})
    .pipe(progressEmitter)
    .pipe(fs.createWriteStream(bundlePath)).on('finish', function() {
      fs.exists(bundlePath, function(yes) {
        if (yes)
          done(null, bundlePath)
        else
          done(new Error("Failed to create project bundle"));
      })
    });
  }
}
