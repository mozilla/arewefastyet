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
    $http.get('../data.php?file=master.js').then(function(data) {

      // Extract master data into JSON data.
      var offset = data.data.indexOf("{");
      var endOffset = data.data.lastIndexOf("}");
      master = data.data.substring(offset, endOffset+1);
      master = JSON.parse(master);

      // Add all machines (remove key)
      $scope.machines = [];
      for(var i in master["machines"]) {
        if(master["machines"][i]["frontpage"]) {
          $scope.machines.push(master["machines"][i]);
        }
      }

      // Watch for changes of selection
      $scope.$watch('selectedMachine', function (machine) { 
        if(!machine) {
          return;
        }

        var path = $location.path().split("/");
        path[2] = machine.id;

        if($location.path() != path) {
          $location.path(path.join("/"));
        }
      });
    });


    
}]);