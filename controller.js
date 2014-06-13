app.controller('SshDeployController', ['$scope', '$http', function ($scope, $http) {
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
  $scope.help = function () {
    $('#ssh_deploy_help').modal();
  };
}]);
