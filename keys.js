var path = require('path'),
home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
fs = require('fs');
module.exports = {
  whatIsMyPublicKey: function() {
    var pubKeyPath = path.join(home, '.ssh', 'id_rsa.pub');
    if (fs.existsSync(pubKeyPath))
      return "Your public key on this worker:\n"+fs.readFileSync(pubKeyPath);
    else
      return "You do not have a public key on this worker. Expected "+pubKeyPath+" to exist";
  },
  getPrivateKey: function(optionalKey, callback) {
    if (optionalKey) { callback(null, optionalKey) } else {
      var keyPath = path.join(home, '.ssh', 'id_rsa');
      if (fs.existsSync(keyPath)) callback(null, fs.readFileSync(keyPath).toString());
      else callback(new Error("No private key available!"));
    }
  }
}
