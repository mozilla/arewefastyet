<html>
<head>
<style>
body {
	margin-left:auto;
	margin-right:auto;
	width: 500px;
}
label {
	margin-top: 25px;
	display: block;
}
input, select {
	display: block;
	width: 500px;
}
#benchmarks {
	height: 150px;
}
</style>
<script src='../jquery/jquery-1.8.3.min.js'></script>
<script>
$(function() {
	function report() {
		alert("Internal error: Please report to hv1989@gmail.com / h4writer on #jsapi.");
	}
	function urlHas(key, value) {
		var params = location.search.split(key+"="+value)
		if (params.length != 2)
			return false;

		if (params[0].slice(-1) != "?" && params[0].slice(-1) != "&")
			return false;

		if (params[1].length != 0 && params[1].substr(0,1) != "&")
			return false;
		return true;
	}
	function normalizeBench(name) {
		// keep in accordance with lib/RetriggerController.php
		name = name.replace(/ [0-9\.]*$/, "");
		name = name.replace("local.", "");
		name = name.replace("remote.", "");
		name = name.replace("shell.", "");
		name = name.replace("-", "");
        if (name == "misc")
			name = "assorted";
		if (name == "ss")
			name = "sunspider";
		if (name == "asmjsubench")
			name = "asmjsmicro";
		return name;
	}
	function benchmarksFromUrl() {
		var params = decodeURIComponent(location.search).split("benchmarks[]=")
		var benchmarks = []
		for (var i = 1; i<params.length; i++) {
			if (params[i-1].slice(-1) != '?' && params[i-1].slice(-1) != "&")
				continue;
			var parts = params[i].split("&");
			var	name = normalizeBench(parts[0]);
			benchmarks.push(name);
		} 
		return benchmarks;
	}

	var benchmarks = [];

	$.ajax({
		url: "data-machines.php",
        dataType: "json",
		statusCode: { 500: report }
	}).done(function(data) {
		var selection = []
		$.each(data, function(descr, id) {
			var option = $('<option>').text(descr);
			option.data("key", id);

			$('#machines').append(option);
			
			var select = true;
			$.each(id, function(key, value) {
				if (!urlHas(key, value))
					select = false;
			});
			if (select) {
				benchmarks = benchmarksFromUrl();
				$('#machines').val(descr).change();
			}
		});
	});

	$('#machines').change(function() {
		var value = $("#machines option:selected").data("key");
		$('#benchmarks').text("");
		if (!value)
			return;
		$.ajax({
			url: "data-benchmarks.php",
            data: value,
			dataType: "json",
			statusCode: { 500: report }
		}).done(function(data) {
			if (typeof data === 'string') {
				alert("Error: "+data);
				return;
			}
			$.each(data, function(id, name) {
				var option = $('<option>').text(name);
				if ($.inArray(normalizeBench(name), benchmarks) != -1)
					option.attr('selected','selected');
				$('#benchmarks').append(option);
			});
		});
	});

	$('#benchmarks').change(function() {
		benchmarks = $('#benchmarks').val();
		for (var i = 0; i < benchmarks.length; i++) {
			benchmarks[i] = normalizeBench(benchmarks[i]);
		}
	});

	var match = location.search.match(/[&?]revision=([a-zA-Z0-9]*)(&|$)/);
	if (match)
		$('#revision').val(match[1]);

	$("#trigger").submit(function(event) {
		event.preventDefault();
		var data = $("#machines option:selected").data("key");
		data["revision"] = $("#revision").val();
		data["benchmarks"] = $("#benchmarks").val();
		console.log(data);
		$.ajax({
			url: "data-submit.php",
            data: data,
			statusCode: { 500: report }
		}).done(function(data) {
			if (data.length > 0) {
				alert("Error: "+data);
			} else {
				alert("Succesfully enqueued");
			}
		});
		return false;
	});
});
</script>
</head>
<body>
<h1>Trigger a revision on AWFY</h1>
<form id='trigger'>
<label>Machine:
	<select id='machines'>
	<option>--- Select a machine ---</option>
	</select>
</label>

<label>Revision:
	<input type='text' name='revision' id='revision'>
</label>

<label>Benchmarks:
	<select multiple id='benchmarks'>
	</select> 
</label>


<input type='submit' value='Trigger!'>

</form>
</body>
</html>
