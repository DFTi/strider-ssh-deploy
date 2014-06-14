var _ = require('lodash');

module.exports = {
  // This is how you would bundle a NODE.JS project...
  bundleProject: function(bundlePath, progress, done) {
    var progressEmitter = false;
    if (_.isFunction(progress)) {
      var progstream = require('progress-stream');
      progressEmitter = progstream({
        time:100,
        length: require('fs').statSync(bundlePath).size
      });
      progressEmitter.on('progress', progress);
    }
    var bundleStream = require('npmd-pack')(context.dataDir, {})
    .pipe(fs.createWriteStream(bundlePath)).on('finish', done);
    if (progressEmitter) bundleStream.pipe(progressEmitter);
  }
}
