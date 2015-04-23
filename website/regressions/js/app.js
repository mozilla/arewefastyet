var awfyApp = angular.module('awfyApp', [
  'ngRoute',
  'awfyControllers'
]);

awfyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/regression/:id', {
        templateUrl: 'partials/regression.html',
        controller: 'regressionCtrl'
      }).
      when('/:search', {
        templateUrl: 'partials/overview.html',
        controller: 'overviewCtrl'
      }).
      otherwise({
        redirectTo: '/open'
      });
  }
]);

awfyApp.config(['$sceDelegateProvider',
  function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'https://chromium.googlesource.com/v8/v8/+log/**',
	  'http://hg.mozilla.org/**',
	  'http://trac.webkit.org/log/**'
    ]);
  }
]);

awfyApp.factory('MasterService', function() {
	return AWFYMaster;
});


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
]);

awfyApp.controller('pageCtrl', ['$scope', 'MasterService', '$http',
  function ($scope, master, $http) {

	var machines = {}
	for (var id in master.machines) {
		machines[id] = master.machines[id];
		machines[id]["selected"] = true;
	}

	$scope.master = {
		"modes": master.modes,
		"machines": machines
	};
	$scope.availablestates = [{"name":"unconfirmed"},
                              {"name":"confirmed"},
                              {"name":"improvement"},
							  {"name":"fixed"},
							  {"name":"wontfix"},
							  {"name":"noise"},
							  {"name":"infrastructure"}];

	$http.get('../auth.php?persona&check').then(function(data) {
      $scope.currentUser = data.data
	});
}]);
