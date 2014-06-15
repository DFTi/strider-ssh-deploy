var Promise = require('bluebird');
var fs = require('fs');
var _ = require('lodash');
var keys = require('./keys');
var bundler = require('./bundler');
var remotely = require('./remotely')

var getConnectionOptions = function(config, callback) {
  keys.getPrivateKey(config.privateKey, function(err, res) {
    if (err) return callback(err);
    else if (_.isArray(config.hosts) && config.hosts.length > 0) {
      return callback(null, _.map(config.hosts, function(host) {
        return {
          host: host,
          port: 22,
          username: config.user,
          privateKey: res
        }
      }));
    } else callback(new Error("Must provide one or more hosts"));
  })
}


module.exports = {
  configure: function(config, done) {
    return function(context, done) {
      getConnectionOptions(config, function(err, hosts) {
        if (err) return done(err);
        context.comment("Bundling project...");
        var projectName = context.job.project.name.replace('/', '_');
        var progress = function(info) { context.comment(info.percentage+"%") };
        bundler.bundleProject(context.dataDir, projectName, progress, function(err, bundlePath) {
          if (err) {
            return done(new Error("Could not create bundle "+bundlePath))
          } else {
            context.comment("Created bundle "+bundlePath);
            var promises = _.map(hosts, function(sshOpts) {
              return remotely.deploy(
                context, projectName, bundlePath, config.script, sshOpts
              )
            });
            Promise.all(promises).then(function() {
              done(0);
            }).catch(function(err) {
              done(err);
            })
          }
        })
      })
    }
  }
}
