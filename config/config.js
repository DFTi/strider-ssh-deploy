(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
app.controller('SshDeployController', ['$scope', '$http', function ($scope, $http) {
  var projectName = $scope.$parent.$parent.project.name;
  $scope.paths = require('./remote_paths')(projectName.replace('/','_'));
  $scope.$watch('configs[branch.name].ssh_deploy.config', function (value) {
    $scope.config = value;
  });
  $scope.saving = false;
  $scope.save = function () {
    $scope.saving = true;
    $scope.pluginConfig('ssh_deploy', $scope.config, function() {
      $scope.saving = false;
    });
  };
  $scope.removeHost = function (index) {
    $scope.config.hosts.splice(index, 1);
    $scope.save();
  };
  $scope.addHost = function () {
    if (!$scope.config.hosts) $scope.config.hosts = [];
    $scope.config.hosts.push($scope.new_host);
    $scope.new_host = '';
    $scope.save();
  };
}]);

},{"./remote_paths":2}],2:[function(require,module,exports){
module.exports = function(name) {
  var remote = '$HOME/'+name;
  return {
    name: name,
    remote: remote,
    old: remote+'.old',
    bundle: "/tmp/package.tar.gz",
  }
}

},{}]},{},[1])