var awfyApp = angular.module('awfyApp', [
  'ngRoute',
  'awfyControllers'
]);

awfyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/machine/:machine', {
        templateUrl: 'partials/overview.html',
        controller: 'overviewCtrl'
      }).
      when('/machine/:machine/suite/:suite', {
        templateUrl: 'partials/overview.html',
        controller: 'overviewCtrl'
      }).
      otherwise({
        redirectTo: '/machine/28'
      });
  }
]);

awfyApp.controller('pageCtrl', ['$scope', '$http', '$q', '$location',
  function ($scope, $http, $q, $location) {

    // Get master data
    $q.all([
		$http.get('../auth.php?persona&check'),
	]).then(function(data) {

      $scope.currentUser = data[0].data

    });

}]);

awfyApp.factory('MasterService', function() {
	return AWFYMaster;
});

