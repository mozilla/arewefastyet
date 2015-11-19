awfyCtrl.service('RegressionService', ["MasterService",
  function (master) {
    this.normalize_score = function(score) {
      score["machine_id"] = score["machine"]
      score["machine"] = master["machines"][score["machine"]]["description"]
      if (score["mode"])
		score["mode_id"] = score["mode"]
      score["mode"] = master["modes"][score["mode_id"]]["name"]
      score["stamp"] = score["stamp"] * 1000

	  var suite_version = score["suite_version_id"]
	  var percent = ((score["score"] / score["prev_score"]) - 1) * 100
	  percent = Math.round(percent * 100)/100;
	  var suite = master["suiteversions"][suite_version]["suite"];
	  var direction = master["suites"][suite]["direction"];
	  var regressed = (direction == 1) ^ (percent > 0)

	  score["suite"] = master["suiteversions"][suite_version]["suite"]
	  score["suiteversion"] = master["suiteversions"][suite_version]["name"]
	  score["suitetest"] = score["suite_test"]
	  score["percent"] = percent
	  score["regression"] = regressed
      return score;
	}
    this.normalize = function(regression) {
      regression["machine_id"] = regression["machine"]
      regression["machine"] = master["machines"][regression["machine"]]["description"]
      if (regression["mode"])
		regression["mode_id"] = regression["mode"]
      regression["mode"] = master["modes"][regression["mode_id"]]["name"]
      regression["stamp"] = regression["stamp"] * 1000
      if ((new Date())*1 - regression["stamp"] > 60*60*24*7*1000)
         regression["detector"] = 1

      if (regression["scores"] && regression["scores"].length > 0) {
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
			regression["scores"][j]["noise"] = regression["scores"][j]["noise"] == "1"
        }

        regression["prev_cset"] = prev_cset

        var vendor_id = master["modes"][regression["mode_id"]]["vendor_id"]
        var range_url = master["vendors"][vendor_id]["rangeURL"]
        range_url = range_url.replace(/{from}/g, prev_cset);
        range_url = range_url.replace(/{to}/g, regression["cset"]);
        range_url = range_url.replace('http://', "//");
        regression["range_url"] = range_url
      }
      return regression;
    }
    this.normalize_states = function(states) {
      for (var i = 0; i < states.length; i++) {
        states[i]["stamp"] = states[i]["stamp"] * 1000;
      }
      return states;
    }
}]);


