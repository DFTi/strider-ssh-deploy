var Promise = require('bluebird');
var Connection = require('ssh2');
var progress = require('progress-stream');
var fs = require('fs');
var path = require('path');
var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

var userScript = 'ls -lah / && sleep 2 && echo "ok im done" && sleep 1 && echo "just kidding" && ls';

function shellCommand(command) {
  if (!command || !command.replace(/#[^\n]*/g, '').trim().length) return
  return {
    command: 'sh',
    args: ['-x', '-c', command]
  }
}

var _ = require('lodash');

var getPrivateKey = function(optionalKey) {
  if (optionalKey) { return optionalKey } else {
    var keyPath = path.join(home, '.ssh', 'id_rsa');
    if (fs.existsSync(keyPath)) return fs.readFileSync(keyPath);
    else throw new Error("No private key available!");
  }
}

var getConnectionOptions = function(config, privateKey) {
  if (_.isArray(config.hosts) && config.hosts.length > 0) {
    return _.map(config.hosts, function(host) {
      return {
        host: host,
        port: 22,
        username: 'deploy',
        privateKey: privateKey
      }
    });
  } else throw new Error("Must provide one or more hosts");
}

var bundler = require('./bundler');

var goDeploy = function(context, bundlePath, remoteBundlePath, userScript, connectOptions) {
  return new Promise(function(resolve, reject) {
    context.comment('Transferring bundle to '+remoteBundlePath);
    var pkgPath = '~/package';
    context.comment("Preparing to deploy...");
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
            shellCommand(userScript)
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
    }).on('end', function() {
      context.comment('Connection :: end');
    }).on('close', function(had_error) {
      context.comment('Connection :: close');
      if (had_error) throw new Error("Connection closed with errors")
    }).connect(connectOptions);
  })
}


module.exports = {
  configure: function(config, done) {
    return function(context, done) {
      var targets = getConnectionOptions(config, getPrivateKey(config.privateKey));
      var bundle = context.job.project.name.replace('/', '_')+'.tar.gz';
      var bundlePath = '/tmp/'+bundle;
      context.comment("Bundling project...");
      bundler.bundleProject(context.dataDir, bundlePath, function(progress) {
        context.comment(progress.percentage+"%");
      }, function() {
        context.comment("Created bundle "+bundlePath);
        var promises = _.map(targets, function(sshOpts) {
          return goDeploy(context, bundlePath, '~/'+bundle, config.script, sshOpts);
        });
        Promise.all(promises).then(function() {
          done(0);
        }).catch(function(err) {
          context.comment(err.message);
          done(-1);
        })
      })
    }
  }
}
