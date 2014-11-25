function createGraph(div, titel, scores) {
	nv.addGraph(function() {
		div.append("h2").text(titel)
	      
		var chart = nv.models.multiBarHorizontalChart()
              .x(function(d) { return d.label })    //Specify the data accessors.
              .y(function(d) { return d.value })
              .tooltips(false)        //Don't show tooltips
              .showValues(true)       //...instead, show the bar value right on top of each bar.
              .showControls(false)
              .transitionDuration(350)
              .barColor( function(d){ return nv.utils.getColor(d["color"]);})
              .width("450");

		div.append("svg")
           .datum(scores)
           .call(chart);

		nv.utils.windowResize(chart.update);

        return chart;
	});
}

function data2nv(scores, direction) {
	adjusted = []
	for (var i = 0; i < scores.length; i++) {
		adjusted[adjusted.length] = {
			"label": AWFYMaster["modes"][scores[i]["modeid"]]["name"],
			"value": scores[i]["score"]*1,
			"color": AWFYMaster["modes"][scores[i]["modeid"]]["color"],
		}
	}
	return [{key: direction == -1 ? "Lower is better" : "Higher is better",
			 values: adjusted}];
}
