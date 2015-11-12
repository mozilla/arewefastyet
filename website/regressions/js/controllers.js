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
awfyCtrl.filter('linkify', function($sce, $parse) {
  return function(input) {
    input = input.replace(/#([0-9]+)/, "<a href='https://bugzilla.mozilla.org/show_bug.cgi?id=$1'>#$1</a>");
    input = input.replace(/@([0-9]+)/, "<a href='http://arewefastyet.com/regressions/#/regression/$1'>@$1</a>");
    return $sce.trustAsHtml(input);
  };
})

awfyCtrl.filter('fromNow', function() {
  return function(dateString) {
    return moment.unix(dateString/1000).fromNow()
  };
});

awfyCtrl.controller('addCtrl', ['$scope', '$http', '$routeParams', 'RegressionService', '$location',
  function ($scope, $http, $routeParams, regression, $location) {
    var data = {};
    data["id"] = $routeParams.id * 1;
    if ($routeParams.subtest)
        data["subtest"] = 1;

    $http.post('data-score.php', data).then(function(data) {
        $scope.regression = regression.normalize_score(data.data);
    });

    $scope.submit = function() {
        $http.post('data-submit.php', data).then(function(data) {
            $location.path("/regression/"+(data.data*1));
        });
    };
  }
]);

awfyCtrl.controller('regressionCtrl', ['$scope', '$http', '$routeParams', '$q', 'modalDialog',
                                       'RegressionService', '$sce',
  function ($scope, $http, $routeParams, $q, modalDialog, regression, $sce) {
    var regression_id = $routeParams.id * 1;
    var requests = [
        $http.post('data-regression.php', {id:regression_id}),
        $http.post('data-regression-status.php', {id:regression_id}),
    ];

    $q.all(requests).then(function(data) {
      $scope.regression = regression.normalize(data[0].data);
      $scope.states = regression.normalize_states(data[1].data);
      var noise = {"score": {}, "breakdown":{}}
      for (var i=0; i<$scope.regression["scores"].length; i++) {
        if (data[0].data["scores"][i]["breakdown_id"]) {
          var id = data[0].data["scores"][i]["breakdown_id"]
          noise["breakdown"][id] = data[0].data["scores"][i]["noise"];
        } else{
          var id = data[0].data["scores"][i]["score_id"]
          noise["score"][id] = data[0].data["scores"][i]["noise"];
        }
      }
      $scope.noise = noise
      updateNoiseCount();

	  $scope.regression.range = undefined
	  $http.post('data-regression-range.php', {id:regression_id}).then(function(data){
		$scope.regression.range = data.data
	  });
    });

    $scope.statusPopup = function(regression) {
        modalDialog.open("partials/loading.html");

        $http.post('data-regression-status.php', {id:regression.id}).then(function(data) {
            var states = regression.normalize_states(data.data);
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
    $scope.showBugPopup = function(regression) {
        modalDialog.open("partials/bug.html", regression);
    }

    $scope.showRetriggerPopup = function(regression, cset) {
        var retrigger = {
            "machine": regression.machine,
            "mode": regression.mode,
            "cset": cset,
            "suites": [],
            "submit": function() {
                var benchmarks = [];
                for (var i=0; i<retrigger.suites.length; i++) {
                    if (retrigger.suites[i].selected)
                        benchmarks.push(retrigger.suites[i].name);
                }
                
                $http.post('retrigger.php', {
                    machine_id: regression.machine_id,
                    mode_id: regression.mode_id,
                    revision: retrigger.cset,
                    run_before_id: regression.prev_run_id,
                    run_after_id: regression.run_id,
                    benchmarks: benchmarks
                }).then(function(data) {
                });
                modalDialog.close()
            }
        }
        var suites = {};
        for (var i=0; i<regression.scores.length; i++) {
            var name = regression.scores[i]["suite"];
            var selected = !regression.scores[i]["noise"];
            if (suites[name]) {
                if (selected && !suites[name]["selected"])
                    suites[name]["selected"] = true;
            } else {
                suites[name] = {
                    "name": name,
                    "selected": selected
                };
                retrigger.suites.push(suites[name]);
            }
        }
        modalDialog.open("partials/retrigger.html", retrigger);
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
            modalDialog.open("partials/graph-popup.html", {
                "url": "//arewefastyet.com/#"+
                       "machine="+regression.machine_id+"&"+
                       "view=single&"+
                       "suite="+score.suite+"&"+
                       (score.suitetest ? "subtest="+score.suitetest+"&" : "") +
                       "start="+(data[0].data*1-1)+"&"+
                       "end="+(data[1].data*1+1),
                "score": score,
                "regression": regression,
                "showRegression": $scope.showRegression
            });        
        });
    }

    $scope.editStatusFn = function() {
        if (!$scope.currentUser)
            return;
        $scope.editStatus = true;
        for (var i=0; i<$scope.availablestates.length; i++) {
            if ($scope.availablestates[i].name == $scope.regression.status)
                $scope.newstatus = $scope.availablestates[i];
        }
    }
    $scope.saveStatusFn = function(status) {
        $http.post('change-status.php', {
            "regression_id": regression_id,
            "name": $scope.currentUser,
            "status": status
        }).success(function() {
            $scope.regression.status = status;
            $scope.editStatus = false;
            updateLogs();
        }).error(function() {
            alert("failed");
        });
    }
    $scope.saveBugFn = function(bug) {
        $http.post('change-bug.php', {
            "regression_id": regression_id,
            "bug": bug
        }).success(function() {
            $scope.regression.bug = bug;
            $scope.editBug = false;
            updateLogs();
        }).error(function() {
            alert("failed");
        });
    }
    $scope.editBugFn = function() {
        $scope.editBug = true;
        $scope.newbug = $scope.regression.bug;
    }
    $scope.addCommentFn = function() {
        $scope.addComment = true;
        $scope.newcomment = ""
    }
    $scope.saveCommentFn = function(status) {
        $http.post('add-comment.php', {
            "regression_id": regression_id,
            "extra": status
        }).success(function() {
            $scope.addComment = false;
            updateLogs();
        }).error(function() {
            alert("failed");
        });
    }
    $scope.editNoiseFn = function() {
        $scope.editNoise = true;
    }
    $scope.saveNoiseFn = function() {
        $http.post('change-noise.php', {
            "regression_id": $scope.regression["id"],
            "noise": $scope.noise
        }).success(function() {
          $scope.editNoise = false;
          updateNoiseCount();
        }).error(function() {
            alert("failed");
        });
    }
    $scope.showNoiseFn = function() {
        $scope.showNoise = true;
    }
    $scope.hideNoiseFn = function() {
        $scope.showNoise = false;
    }

    function updateLogs() {
      $http.post('data-regression-status.php', {id:regression_id}).then(function(data) {
        $scope.states = regression.normalize_states(data.data);
      });
    }

    function updateNoiseCount() {
      var count = 0;
      for (var j = 0; j < $scope.regression["scores"].length; j++) {
        if ($scope.regression["scores"][j]["suitetest"]) {
          var id = $scope.regression["scores"][j]["breakdown_id"];
          $scope.regression["scores"][j]["noise"] = $scope.noise.breakdown[id]
          if ($scope.noise.breakdown[id])
            count++;
        } else { 
          var id = $scope.regression["scores"][j]["score_id"];
          $scope.regression["scores"][j]["noise"] = $scope.noise.score[id]
          if ($scope.noise.score[id])
            count++;
        }
      }
      $scope.noiseCount = count;
    }
  }
]);

awfyCtrl.controller('compareCtrl', ['$scope', '$http', '$routeParams', '$q', 'modalDialog',
                                   'RegressionService', '$location',
  function ($scope, $http, $routeParams, $q, modalDialog, regression, $location) {
    var regression_id = $routeParams.id * 1;

    $http.post('data-regression.php', {
      id:regression_id
    }).then(function(data) {
        $scope.regression = regression.normalize(data.data);

        $http.post('data-revision.php', {
          machine: $scope.regression["machine_id"],
          mode: $scope.regression["mode_id"],
        }).then(function(data) {
          for (var i=0; i<$scope.regression.scores.length; i++) {
            for (var j=0; j<data.data.length; j++) {
              if ($scope.regression.scores[i]["suite_version"] == data.data[j]["suite_version"] &&
                  $scope.regression.scores[i]["suite_test"] == data.data[j]["suite_test"])
              {
                 var now = data.data[j]["score"];
                 var prev = $scope.regression.scores[i]["prev_score"];
                 var score = $scope.regression.scores[i]["score"];
                 $scope.regression.scores[i]["now"] = now;
                 if (Math.abs(prev - now) < Math.abs(score - now)) {
                    if (score > prev) {
                        if (now < prev + 0.2 * (score - prev))
                            $scope.regression.scores[i]["good"] = 1;
                    } else {
                        if (now > prev + 0.2 * (score - prev))
                            $scope.regression.scores[i]["good"] = 1;
                    }
                 } else {
                    if (score > prev) {
                        if (now > score - 0.8 * (score - prev))
                            $scope.regression.scores[i]["bad"] = 1;
                    } else {
                        if (now < score - 0.8 * (score - prev))
                            $scope.regression.scores[i]["bad"] = 1;
                    }
                 }
              }
            }
          }
        });
    });
    
    $scope.showRegression = function(regression, score) {
        var start = regression.stamp/1000;
        var end = new Date()/1000;

        // Increase start so it is visible.
        var duration = end - start;
        start -= duration * 0.1;

        modalDialog.open("partials/graph-popup.html", {
            "url": "//arewefastyet.com/#"+
                   "machine="+regression.machine_id+"&"+
                   "view=single&"+
                   "suite="+score.suite+"&"+
                   (score.suitetest ? "subtest="+score.suitetest+"&" : "") +
                   "start="+start+"&"+
                   "end="+end,
            "score": score,
            "regression": regression,
            "showRegression": $scope.showRegression
        });        
    }

  }
]);


awfyCtrl.controller('searchCtrl', ['$scope', '$http', '$routeParams', '$q', 'modalDialog',
                                   'RegressionService', '$location',
  function ($scope, $http, $routeParams, $q, modalDialog, regression, $location) {

    function setDefaultModeAndMachine() {
        var machines = ["11","12","14","17","26","27","28","29","30"];
        var modes = ["14","16","20","21","22","23","25","26","27","28","29","31","32","33","35"];
        setMachines(machines);
        setModes(modes);
        setBug(undefined);
    }
    function setModes(modes) {
        for (var id in modes) {
            $scope.master.modes[modes[id]].selected = true;
        }
    }
    function getModes() {
        var modes = []
        for (var mode in $scope.master.modes) {
            if ($scope.master.modes[mode].selected)
                modes.push(mode);
        }
        return modes;
    }
    function setBug(bug) {
        $scope.bug = bug 
    }
    function getBug() {
        return $scope.bug;
    }
    function setMachines(machines) {
        for (var id in machines) {
            $scope.master.machines[machines[id]].selected = true;
        }
    }
    function getMachines() {
        var machines = []
        for (var machine in $scope.master.machines) {
            if ($scope.master.machines[machine].selected)
                machines.push(machine);
        }
        return machines;
    }
    function setStates(states) {
        for (var id in $scope.availablestates) {
            var state = $scope.availablestates[id];
            state.selected = states.indexOf(state.name) != -1;
        }
    }
    function getStates() {
        var states = []
        for (var id in $scope.availablestates) {
            if ($scope.availablestates[id].selected)
                states.push($scope.availablestates[id].name);
        }
        return states;
    }
    function setTitle(title) {
        $scope.title = title
    }
    function initAdvanced() {
        var search = $location.search();
        setMachines(search.machines || []);
        setStates(search.states || []);
        setModes(search.modes || []);
        setBug(search.bug);
        fetch()
    }
    function fetch() {
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
            states:selected_states,
            bug:$scope.bug
        }).then(function(data) {

            if ($routeParams.search == "notTriaged")
                $scope.$parent.triaged_no = data.data.length;

            $scope.ids = data.data
            $scope.currentPage = 1;
            $scope.items = $scope.ids.length;
            $scope.advanced = ($routeParams.search == "advanced");

            $scope.fetchPage();
        });
    }

    $scope.fetchPage = function() {
        $scope.regressions = [];
        var ids = $scope.ids.slice(($scope.currentPage - 1) * 10, $scope.currentPage * 10);
        var minimal = false;
        if ($location.path().indexOf("open") == 1 && !$routeParams.bug) {
            ids = $scope.ids;
            minimal = true;
        }

        $http.post('data-regression.php', {
            ids: ids,
            minimal: minimal
        }).then(function(data) {

          var regressions = data.data;
          for (var i = 0; i < regressions.length; i++) {
            regressions[i] = regression.normalize(regressions[i])
          }

          $scope.regressions = regressions;

          if ($location.path().indexOf("open") == 1 && !$routeParams.bug) {
            var bugs = [];
            for (var j = 0; j < regressions.length; j++) {
                var bug = regressions[j].bug;
                if (!bugs[bug])
                    bugs[bug] = {"items":[], "bug":bug};
                bugs[bug].items[bugs[bug].items.length] = regressions[j];
            }
            var retBugs = [];
            bugs.forEach(function(el) {
                retBugs[retBugs.length] = el;
                $http.get(
                    'https://bugzilla.mozilla.org/rest/bug/'+el.bug+'?include_fields=summary'
                ).then(function(data) {
                    for (var j=0; j<$scope.bugs.length; j++) {
                        if ($scope.bugs[j]["bug"] == el.bug) {
                            $scope.bugs[j]["title"] = data.data["bugs"][0]["summary"];
                        }    
                    }
                },function(data) {
                    for (var j=0; j<$scope.bugs.length; j++) {
                        if ($scope.bugs[j]["bug"] == el.bug) {
                            if (data.data["code"] && data.data["code"] == 102)
                                $scope.bugs[j]["title"] = "Security bug"; 
                        }
                    }
                });
            });
            $scope.bugs = retBugs;
          }
        });

    }

    $scope.setNonTriaged = function() {
        setTitle("Untriaged regressions");
        setDefaultModeAndMachine();
        setStates(["unconfirmed"]);
        fetch()
    }
    $scope.setNotFixedRegressions = function(bug) {
        if (bug === undefined)
            setTitle("Confirmed regressions");
        else if (bug == 0)
            setTitle("Confirmed regressions without bug number");
        else
            setTitle("Confirmed regressions for #"+bug);
        setDefaultModeAndMachine();
        setStates(["confirmed"]);
        setBug(bug);
        fetch()
    }
    $scope.setRegressions = function(bug) {
        setTitle("Regressions for #"+bug);
        setDefaultModeAndMachine();
        setStates(["confirmed", "fixed", "improvement", "wontfix"]);
        setBug(bug);
        fetch()
    }
    $scope.setImprovements = function() {
        setTitle("Improvements");
        setDefaultModeAndMachine();
        setStates(["improvement"]);
        fetch()
    }
    $scope.advancedSearch = function() {
        setTitle("Search");
        $scope.advanced = true;
    }
    $scope.open = function(id) {
        $location.path("/regression/"+id);
    }
    $scope.search = function() {
        $location.path("advanced");
        $location.search({machines: getMachines(), states: getStates(), modes: getModes(),
                          bug: getBug()});
    }

    $scope.advanced = ($routeParams.search == "advanced");
    $scope.regressions = [];

    if ($location.path().indexOf("open") == 1)
        $scope.setNotFixedRegressions($routeParams.bug);
    else if ($location.path().indexOf("bug") == 1)
        $scope.setRegressions($routeParams.bug);
    else if ($routeParams.search == "improvements")
        $scope.setImprovements();
    else if ($routeParams.search == "advanced")
        initAdvanced();
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

awfyCtrl.controller('graphCtrl', ['$scope', '$http',
  function ($scope, $http) {
    $http.get('data-graph.php').then(function(data) {

      $scope.chart = {
        "type": "Calendar",
        "cssStyle": "height:350px; width:1200px;",
        "data": {
          "cols": [
            { type: 'date', id: 'Date' },
            { type: 'number', id: 'Won/Loss' }
          ],
          "rows": data.data
        },
        "options": {
          title: "Reported noisy benchmark",
          height: 350,
        }
      
      }

    });
  }
]);
