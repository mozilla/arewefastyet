var awfyApp = angular.module('awfyApp', [
  'ngRoute',
  'awfyControllers'
]);

awfyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/:search', {
        templateUrl: 'partials/overview.html',
        controller: 'overviewCtrl'
      }).
      otherwise({
        redirectTo: '/open'
      });
  }
]);

awfyApp.service("modalDialog", function() {
  this.open = function(template, data) {
	this.template = template
	this.data = data;
  }
  this.close = function() {
	this.template = undefined
  }
  this.template = undefined
  this.data = {}
})

awfyApp.controller('dialogCtrl', ['$scope', 'modalDialog',
  function ($scope, modalDialog) {
	$scope.modalDialog = modalDialog
	$scope.$watch("modalDialog.template", function(newVal, oldVal) {
		$scope.modaltemplate = newVal;
	});
	$scope.$watch("modalDialog.data", function(newVal, oldVal) {
		$scope.modal = newVal;
	});

	$scope.closeDialog = function(e) {
		// Only close if clicking on the background,
		// not on dialog itself.
		var targ;
		if (!e) var e = window.event;
		if (e.target) targ = e.target;
		else if (e.srcElement) targ = e.srcElement;
		if (targ.nodeType == 3) // defeat Safari bug
			targ = targ.parentNode;
		if (targ.className.indexOf("modal") !== -1)
			modalDialog.close();
	}
  }
])

awfyApp.controller('pageCtrl', ['$scope', '$http', '$q', '$location', 'modalDialog',
  function ($scope, $http, $q, $location, modalDialog) {

	for (var id in AWFYMaster.machines) {
		AWFYMaster.machines[id].selected = true;
	}

	$scope.master = AWFYMaster;
	$scope.currentUser = currentUser;
	$scope.availablestates = [{"name":"unconfirmed"},
                              {"name":"confirmed"},
                              {"name":"improvement"},
							  {"name":"fixed"},
							  {"name":"wontfix"},
							  {"name":"infrastructure"}];

}]);
