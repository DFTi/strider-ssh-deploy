var fs = require('fs');
var Connection = require('ssh2');
var Promise = require('bluebird');
var progress = require('progress-stream');

function devnull(str) { return str+' > /dev/null 2>&1' };
function prepare(projectName, bundlePath) {
  var projectPath = '$HOME/'+projectName;
  return [
    devnull('rm -rf '+projectPath+'.old'),
    devnull('mv '+projectPath+' '+projectPath+'.old'),
    devnull('mkdir '+projectPath),
    devnull('tar -zxf '+bundlePath+' -C '+projectPath+' --strip-components=1'),
    '\n' // keep this newline so you can simply concat more onto this output
  ].join('\n')
}

module.exports = {
  deploy: function(context, name, localBundlePath, script, connectOptions) {
    return new Promise(function(resolve, reject) {
      if (! connectOptions.username)
        return reject(new Error("Please set a user in the config!"));
      var pkgPath = '$HOME/package';
      var bundlePath = "/tmp/package.tar.gz";
      var conn = new Connection();
      conn.on('ready', function() {
        context.comment('Connection :: ready');
        conn.sftp(function (err, sftp) {
          if (err) throw err;
          var writeStream = sftp.createWriteStream(bundlePath);
          var str = progress({time:1000, length: fs.statSync(localBundlePath).size});
          str.on('progress', function (info) { context.comment(info.percentage+"%") });
          fs.createReadStream(localBundlePath).pipe(str)
          .pipe(writeStream).on('close', function () {
            context.comment("Replacing "+pkgPath+" with bundle contents");
            conn.exec(prepare(name, bundlePath).concat(script), function(err, stream) {
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
}
