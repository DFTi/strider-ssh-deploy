var fs = require('fs');
var Connection = require('ssh2');
var Promise = require('bluebird');
var progress = require('progress-stream');

function devnull(str) { return str+' > /dev/null 2>&1' };
function prepare(paths) {
  return [
    devnull('rm -rf '+paths.old),
    devnull('mv '+paths.remote+' '+paths.old),
    devnull('mkdir '+paths.remote),
    devnull('tar -zxf '+paths.bundle+' -C '+paths.remote+' --strip-components=1'),
    '\n' // keep this newline so you can simply concat more onto this output
  ].join('\n')
}

function runScript(conn, script, out) {
  conn.exec(script, function(err, stream) {
    if (err) throw err;
    stream
    .on('close', function() {
      conn.end();
    })
    .on('data', function(data) {
      out(data.toString());
    })
  });
}

module.exports = {
  deploy: function(out, projectName, localBundlePath, script, connectOptions, sftpProgress) {
    var paths = require('./remote_paths')(projectName);
    return new Promise(function(resolve, reject) {
      if (! connectOptions.username)
        return reject(new Error("Please set a user in the config!"));
      var conn = new Connection();
      conn.on('ready', function() {
        conn.sftp(function (err, sftp) {
          if (err) throw err;
          var writeStream = sftp.createWriteStream(paths.bundle);
          var str = progress({time:1000, length: fs.statSync(localBundlePath).size});
          str.on('progress', sftpProgress)
          fs.createReadStream(localBundlePath).pipe(str)
          .pipe(writeStream)
          .on('close', function() {
            runScript(conn, prepare(paths).concat(script), out);
          })
        });
      }).on('error', function(err) {
        if ( /Authentication failure/.test(err.message) ) {
          reject(new Error("Host "+connectOptions.host+" did not include your public key as an authorized key.\n"+keys.whatIsMyPublicKey()));
        } else 
          reject(err);
      }).on('close', function(had_error) {
        had_error ? reject() : resolve()
      }).connect(connectOptions);
    })
  }
}
