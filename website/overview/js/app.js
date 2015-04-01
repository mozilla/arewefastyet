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
		$http.get('../data.php?file=master.js'),
		$http.get('../auth.php?persona&check'),
	]).then(function(data) {

      $scope.currentUser = data[1].data

      // Extract master data into JSON data.
      var offset = data[0].data.indexOf("{");
      var endOffset = data[0].data.lastIndexOf("}");
      master = data[0].data.substring(offset, endOffset+1);
      master = JSON.parse(master);

      // Add all machines (remove key)
      var createMachines = function(frontpage) {
        $scope.machines = [];
        for(var i in master["machines"]) {
          if(!frontpage || master["machines"][i]["frontpage"]) {
            master["machines"][i]["id"] += "";
            $scope.machines.push(master["machines"][i]);
          }
        }
      }
      createMachines(true);  

      // Watch on location change
      var locationChangeSuccess = function(event) {
        var path = $location.path().split("/");
        if(!$scope.selectedMachine || path[2] != $scope.selectedMachine.id) {
          if(path[2].indexOf(",") == -1) {
            // Check if machine is in full set or in frontpage set
            createMachines(master["machines"][parseInt(path[2])]["frontpage"]);

          } else {

            // Check if "multiple machine" has already been made
            var has = false;
            for(var i in $scope.machines) {
              if($scope.machines[i].id == path[2]) {
                has = true;
              }
            }

            // Create "multiple machine"
            if(!has) {
              $scope.machines.push({
                id: path[2],
                description: "Multipe machines",
              });
            }
          }

          $scope.selectedMachine = {id: path[2]};
        }
      };
      $scope.$on('$locationChangeSuccess', locationChangeSuccess);
      locationChangeSuccess();

      
      // Watch for changes of selection
      $scope.$watch('selectedMachine', function (machine, id) { 
        if(!machine) {
          return;
        }

        if(machine.id) {
          machine = machine.id;
        }

        // Update location
        var path = $location.path().split("/");
        if(machine != path[2]) { 
          path[2] = machine;
          $location.path(path.join("/"));
        }
      });
    });


    
}]);
