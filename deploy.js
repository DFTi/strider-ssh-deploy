var Promise = require('bluebird');
var Connection = require('ssh2');
var progress = require('progress-stream');
var fs = require('fs');

function shellCommand(command) {
  if (!command || !command.replace(/#[^\n]*/g, '').trim().length) return
  return {
    command: 'sh',
    args: ['-x', '-c', command]
  }
}

var _ = require('lodash');
var keys = require('./keys');

var getConnectionOptions = function(config, callback) {
  keys.getPrivateKey(config.privateKey, function(err, res) {
    if (err) return callback(err);
    else if (_.isArray(config.hosts) && config.hosts.length > 0) {
      return callback(null, _.map(config.hosts, function(host) {
        return {
          host: host,
          port: 22,
          username: config.username,
          privateKey: res
        }
      }));
    } else callback(new Error("Must provide one or more hosts"));
  })
}

var bundler = require('./bundler');

var goDeploy = function(context, bundlePath, remoteBundlePath, userScript, connectOptions) {
  return new Promise(function(resolve, reject) {
    if (! connectOptions.username)
      return reject(new Error("Please set a username!"));
    var pkgPath = '~/package';
    var conn = new Connection();
    conn.on('ready', function() {
      context.comment('Connection :: ready');
      conn.sftp(function (err, sftp) {
        if (err) throw err;
        var writeStream = sftp.createWriteStream(remoteBundlePath);
        var str = progress({time:250, length: fs.statSync(bundlePath).size});
        str.on('progress', function (info) { context.comment(info.percentage+"%") });
        fs.createReadStream(bundlePath).pipe(str)
        .pipe(writeStream).on('close', function () {
          context.comment("Replacing "+pkgPath+" with bundle contents");
          function devnull(str) { return str+' > /dev/null 2>&1' };
          conn.exec([
            devnull('rm -rf '+pkgPath+'.previous'),
            devnull('mv '+pkgPath+' '+pkgPath+'.previous'),
            devnull('tar -zxf '+remoteBundlePath),
            shellCommand(config.script)
          ].join('\n'), function(err, stream) {
            if (err) throw err;
            stream.on('end', function() {
              context.comment('Stream :: EOF');
            }).on('exit', function(code, signal) {
              context.comment('Stream :: exit :: code: ' + code + ', signal: ' + signal);
            }).on('close', function() {
              context.comment('Stream :: close');
              conn.end();
            }).on('data', function(data) {
              context.out(data);
            });
          });
        });
      });
    }).on('error', function(err) {
      context.comment('Connection :: error :: ' + err);
      if ( /Authentication failure/.test(err.message) ) {
        reject(new Error("Host "+connectOptions.host+" did not include your public key as an authorized key.\n"+keys.whatIsMyPublicKey()));
      } else 
        reject(err);
    }).on('end', function() {
      context.comment('Connection :: end');
    }).on('close', function(had_error) {
      context.comment('Connection :: close');
      had_error ? reject() : resolve()
    }).connect(connectOptions);
  })
}


module.exports = {
  configure: function(config, done) {
    return function(context, done) {
      getConnectionOptions(config, function(err, hosts) {
        if (err) return done(err);
        var bundle = context.job.project.name.replace('/', '_')+'.tar.gz';
        var bundlePath = '/tmp/'+bundle;
        context.comment("Bundling project...");
        bundler.bundleProject(context.dataDir, bundlePath, function(progress) {
          context.comment(progress.percentage+"%");
        }, function() {
          context.comment("Created bundle "+bundlePath);
          var promises = _.map(hosts, function(sshOpts) {
            return goDeploy(context, bundlePath, '~/'+bundle, config.script, sshOpts);
          });
          Promise.all(promises).then(function() {
            done(0);
          }).catch(function(err) {
            done(err);
          })
        })
      })
    }
  }
}
