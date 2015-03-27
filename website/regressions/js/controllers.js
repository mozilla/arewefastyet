var awfyCtrl = angular.module('awfyControllers', []);

var isFF = function(name) {
  if(name.indexOf("Ion") != -1) {
    return true;
  } else if(name.indexOf("Beta") != -1) {
    return true;
  } else if(name.indexOf("Shell") != -1) {
    return true;
  } else if(name.indexOf("no asmjs") != -1) {
    return true;
  }
  return false;
}

awfyCtrl.controller('regressionCtrl', ['$scope', '$http', '$routeParams', '$q', 'modalDialog',
  function ($scope, $http, $routeParams, $q, modalDialog) {

	$http.post('data-regression.php', {
		id:$routeParams.id
	}).then(function(data) {
	  var master = $scope.master;
	  $scope.regression = normalize_regression_data(master, data.data);
	});

	$scope.statusPopup = function(regression) {
		modalDialog.open("partials/loading.html");

		$http.get('data-regression-status.php?regression_id='+regression.id).then(function(data) {
			var states = data.data;
			for (var i = 0; i < states.length; i++) {
				states[i]["stamp"] = states[i]["stamp"] * 1000;
			}
			var data = {
				"states": states,
				"status": states[0].status.name,
				"extra": states[0].extra,
                "submit": function(data) {

					$http.post('add-status.php', {
						"regression_id": regression.id,
                        "name": currentUser,
                        "status": data.status.name,
                        "extra": data.extra 
					}).then(function () {
						regression.status = data.status.name
						regression.status_extra = data.extra
						modalDialog.close();
					});
				}
			}
			modalDialog.open("partials/status.html", data);
		});
	}
	$scope.bugPopup = function(id, data) {
		data["submit"] = function(data) {
			$http.post('change-bug.php', {
				"regression_id": id,
				"bug": data.bug
			}).then(function () {
				// TODO update item!!
				modalDialog.close();
			});
		}
		modalDialog.open("partials/bug.html", data);
	}

	$scope.showRegression = function(regression, score, amount) {
		modalDialog.open("partials/loading.html");

		var requests = [
			$http.post('data-prev-next-stamp.php', {
				"score_id": score.id,
				"amount": amount,
				"type": "prev"
			}),
			$http.post('data-prev-next-stamp.php', {
				"score_id": score.id,
				"amount": amount+1,
				"type": "next"
			}),
		];

		$q.all(requests).then(function(data) {
			modalDialog.open("partials/graph.html", {
				"url": "http://arewefastyet.com/#"+
					   "machine="+regression.machine_id+"&"+
					   "view=single&"+
					   "suite="+score.suite+"&"+
					   (score.suitetest ? "subtest="+score.suitetest+"&" : "") +
					   "start="+data[0].data+"&"+
					   "end="+data[1].data,
				"score": score,
				"regression": regression,
				"showRegression": $scope.showRegression
			});		
		});
	}
  }
]);

function normalize_regression_data(master, regression) {
	regression["machine_id"] = regression["machine"]
	regression["machine"] = master["machines"][regression["machine"]]["description"]
	regression["mode"] = master["modes"][regression["mode"]]["name"]
	regression["stamp"] = regression["stamp"] * 1000

	if (regression["scores"].length > 0) {
	  var prev_cset = regression["scores"][0]["prev_cset"];
	  for (var j = 0; j < regression["scores"].length; j++) {
		var score = regression["scores"][j]
		var suite_version = score["suite_version"]
		var percent = ((score["score"] / score["prev_score"]) - 1) * 100
		percent = Math.round(percent * 100)/100;
		var suite = master["suiteversions"][suite_version]["suite"];
		var direction = master["suites"][suite]["direction"];
		var regressed = (direction == 1) ^ (percent > 0)

		// unset prev_cset if they differ for different scores
		if (prev_cset != regression["scores"][j]["prev_cset"])
			prev_cset = ""

		regression["scores"][j]["suite"] = master["suiteversions"][suite_version]["suite"]
		regression["scores"][j]["suiteversion"] = master["suiteversions"][suite_version]["name"]
		regression["scores"][j]["suitetest"] = score["suite_test"]
		regression["scores"][j]["percent"] = percent
		regression["scores"][j]["regression"] = regressed
	  }

	  regression["prev_cset"] = prev_cset
	}
	return regression;
}

awfyCtrl.controller('overviewCtrl', ['$scope', '$http', '$routeParams', '$q', 'modalDialog',
  function ($scope, $http, $routeParams, $q, modalDialog) {

	function setDefaultModeAndMachine() {
		var machines = ["10","11","12","14","17","20","21","22","26","27","28","29","30"];
        var modes = ["14","16","20","21","22","23","25","26","27","28","29","31","32","33","35"];
		for (var id in machines) {
			$scope.master.machines[machines[id]].selected = true;
		}
		for (var id in modes) {
			$scope.master.modes[modes[id]].selected = true;
		}
	}
	function setState(states) {
		for (var id in $scope.availablestates) {
			var state = $scope.availablestates[id];
			state.selected = states.indexOf(state.name) != -1;
		}
	}
	$scope.setNonTriaged = function() {
		setDefaultModeAndMachine();
		setState(["unconfirmed"]);
		$scope.search()
	}
	$scope.setNotFixedRegressions = function() {
		setDefaultModeAndMachine();
		setState(["confirmed"]);
		$scope.search()
	}
	$scope.setImprovements = function() {
		setDefaultModeAndMachine();
		setState(["improvement"]);
		$scope.search()
	}
	$scope.advancedSearch = function() {
		$scope.advanced = true;
	}
	$scope.search = function() {
		var selected_machines = []
		for (var id in $scope.master.machines) {
			if ($scope.master.machines[id].selected)
				selected_machines.push(id);	
		}
		var selected_modes = []
		for (var id in $scope.master.modes) {
			if ($scope.master.modes[id].selected)
				selected_modes.push(id);	
		}
		var selected_states = []
		for (var id in $scope.availablestates) {
			if ($scope.availablestates[id].selected)
				selected_states.push($scope.availablestates[id].name);	
		}

		$http.post('data-search.php', {
			machines:selected_machines,
			modes:selected_modes,
			states:selected_states
		}).then(function(data) {
			$http.post('data-regression.php', {
				ids:data.data
			}).then(function(data) {
    
			  var regressions = data.data;
			  var master = $scope.master;

			  for (var i = 0; i < regressions.length; i++) {
				regressions[i] = normalize_regression_data(master, regressions[i])
			  }

			  $scope.regressions = regressions;
			  $scope.advanced = false;
			});
		});
    }

	$scope.statusPopup = function(regression) {
		modalDialog.open("partials/loading.html");

		$http.get('data-regression-status.php?regression_id='+regression.id).then(function(data) {
			var states = data.data;
			for (var i = 0; i < states.length; i++) {
				states[i]["stamp"] = states[i]["stamp"] * 1000;
			}
			var data = {
				"states": states,
				"status": states[0].status.name,
				"extra": states[0].extra,
                "submit": function(data) {

					$http.post('add-status.php', {
						"regression_id": regression.id,
                        "name": currentUser,
                        "status": data.status.name,
                        "extra": data.extra 
					}).then(function () {
						regression.status = data.status.name
						regression.status_extra = data.extra
						modalDialog.close();
					});
				}
			}
			modalDialog.open("partials/status.html", data);
		});
	}
	$scope.bugPopup = function(id, data) {
		data["submit"] = function(data) {
			$http.post('change-bug.php', {
				"regression_id": id,
				"bug": data.bug
			}).then(function () {
				// TODO update item!!
				modalDialog.close();
			});
		}
		modalDialog.open("partials/bug.html", data);
	}

	$scope.showRegression = function(regression, score, amount) {
		modalDialog.open("partials/loading.html");

		var requests = [
			$http.post('data-prev-next-stamp.php', {
				"score_id": score.score_id,
				"breakdown_id": score.breakdown_id,
				"amount": amount,
				"type": "prev"
			}),
			$http.post('data-prev-next-stamp.php', {
				"score_id": score.score_id,
				"breakdown_id": score.breakdown_id,
				"amount": amount+1,
				"type": "next"
			}),
		];

		$q.all(requests).then(function(data) {
		console.log(data)
			modalDialog.open("partials/graph.html", {
				"url": "http://arewefastyet.com/#"+
					   "machine="+regression.machine_id+"&"+
					   "view=single&"+
					   "suite="+score.suite+"&"+
					   (score.suitetest ? "subtest="+score.suitetest+"&" : "") +
					   "start="+data[0].data+"&"+
					   "end="+data[1].data,
				"score": score,
				"regression": regression,
				"showRegression": $scope.showRegression
			});		
		});
	}

	$scope.advanced = false;
	//$scope.master = master
	$scope.regressions = [];

	if ($routeParams.search == "open")
		$scope.setNotFixedRegressions();
	else if ($routeParams.search == "improvements")
		$scope.setImprovements();
	else
		$scope.setNonTriaged();

  }
]);


awfyCtrl.controller('ffIconCtrl', function ($scope) {
  var times = 0;
  $("body").on("keypress", function(e) {
    if(e.key == "f") {
      times++;

      setTimeout(function() {
        times--;
      }, 1000);
    }

    if(times == 2) {
      $("body").addClass("ff");
    }
  });
});
