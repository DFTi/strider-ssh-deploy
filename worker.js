function shellCommand(command) {
  if (!command || !command.replace(/#[^\n]*/g, '').trim().length) return
  return {
    command: 'sh',
    args: ['-x', '-c', command]
  }
}

var client = require('scp2');
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

module.exports = {
  init: function (config, job, context, done) {
    done(null, {
      deploy: function(context, done) {
        context.comment("Preparing to deploy...");
        /*
        var Connection = require('ssh2');

        var conn = new Connection();
        conn.on('ready', function() {
          context.comment('Connection :: ready');
          conn.exec('uptime', function(err, stream) {
            if (err) throw err;
            stream.on('end', function() {
              context.comment('Stream :: EOF');
            }).on('exit', function(code, signal) {
              context.comment('Stream :: exit :: code: ' + code + ', signal: ' + signal);
            }).on('close', function() {
              context.comment('Stream :: close');
              conn.end();
            }).on('data', function(data) {
              context.comment('STDOUT: ' + data);
            //}).stderr.on('data', function(data) {
            //  context.comment('STDERR: ' + data);
            });
          });
        }).on('error', function(err) {
          context.comment('Connection :: error :: ' + err);
        }).on('end', function() {
          context.comment('Connection :: end');
        }).on('close', function(had_error) {
          context.comment('Connection :: close');
          done();
        }).connect(connectOptions);
       */


      /*
        var client = require('scp2');
        context.comment('Transferring project to '+remoteDir);
        client.scp(context.dataDir, _.extend({
          path: remoteDir
        }, connectOptions), function(err) {
          if (err) 
            context.comment(err);
          context.comment("Project deployed at "+remoteDir);
          done();
        });
       */
        var name = context.job.project.name.replace('/', '_');

        var bundlePath = '/tmp/'+name+'.tar.gz';
        require('npmd-pack')(context.dataDir, {})
        .pipe(fs.createWriteStream(bundlePath))
        .on('finish', function () {
          context.comment("Created bundle "+bundlePath);
          var remoteBundlePath = deployHome+'/'+name+'.tar.gz';
          context.comment('Securely copying bundle to '+remoteBundlePath);
          client.scp(bundlePath, _.extend({
            path: remoteBundlePath
          }, connectOptions), function(err) {
            if (err) { context.comment(err); return done(-1) }
            context.comment("Bundle copied to "+remoteBundlePath);
            done();
          });
        });

      }
    });
  }
}
