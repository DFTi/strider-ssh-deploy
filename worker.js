function shellCommand(command) {
  if (!command || !command.replace(/#[^\n]*/g, '').trim().length) return
  return {
    command: 'sh',
    args: ['-x', '-c', command]
  }
}

var progress = require('progress-stream');
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var connectOptions = {
  host: 'staging.critiqueapp.com',
  port: 22,
  username: 'deploy',
  privateKey: fs.readFileSync(path.join(home, '.ssh', 'id_rsa'))
};

var deployHome = '/home/deploy';
var userScript = 'ls -lah / && sleep 2 && echo "ok im done" && sleep 1 && echo "just kidding" && ls';

module.exports = {
  init: function (config, job, context, done) {
    done(null, {
      deploy: function(context, done) {
        context.comment("Preparing to deploy...");
        var Connection = require('ssh2');
        var conn = new Connection();
        conn.on('ready', function() {
          context.comment('Connection :: ready');
          var name = context.job.project.name.replace('/', '_');
          context.comment("Bundling project...");
          var bundlePath = '/tmp/'+name+'.tar.gz';
          var bundleStream = require('npmd-pack')(context.dataDir, {})
          .pipe(fs.createWriteStream(bundlePath))
          .on('finish', function () {
            context.comment("Created bundle "+bundlePath);
            var remoteBundlePath = deployHome+'/'+name+'.tar.gz';
            context.comment('Transferring bundle to '+remoteBundlePath);
            conn.sftp(function (err, sftp) {
              if (err) throw err;
              var writeStream = sftp.createWriteStream(remoteBundlePath);
              var str = progress({time:500, length: fs.statSync(bundlePath).size});
              str.on('progress', function (info) { context.comment(info.percentage+"%") });
              fs.createReadStream(bundlePath).pipe(str)
              .pipe(writeStream).on('close', function () {
                var pkgPath = deployHome+'/package';
                context.comment("Replacing "+pkgPath+" with bundle contents");
                function devnull(str) { return str+' > /dev/null 2>&1' };
                conn.exec([
                  devnull('rm -rf '+deployHome+'/package.previous'),
                  devnull('mv '+deployHome+'/package '+deployHome+'/package.previous'),
                  devnull('tar -zxf '+remoteBundlePath),
                  userScript
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
          });
        }).on('error', function(err) {
          context.comment('Connection :: error :: ' + err);
        }).on('end', function() {
          context.comment('Connection :: end');
        }).on('close', function(had_error) {
          context.comment('Connection :: close');
          done((had_error ? -1 : 0));
        }).connect(connectOptions);
      }
    });
  }
}
