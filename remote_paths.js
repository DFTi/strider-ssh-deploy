module.exports = function(name) {
  var remote = '$HOME/'+name;
  return {
    name: name,
    remote: remote,
    old: remote+'.old',
    bundle: "/tmp/package.tar.gz",
  }
}
