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
