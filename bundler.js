var _ = require('lodash');
var fs = require('fs');

module.exports = {
  // This is how you would bundle a NODE.JS project...
  bundleProject: function(dataDir, bundlePath, progress, done) {
    var progstream = require('progress-stream');
    progressEmitter = progstream({ time:250 });
    progressEmitter.on('progress', progress);
    require('npmd-pack')(dataDir, {})
    .pipe(progressEmitter)
    .pipe(fs.createWriteStream(bundlePath)).on('finish', done);
  }
}
