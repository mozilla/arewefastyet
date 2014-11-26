<?php
session_start();

$machine = 30;
$suiteVersion = 0;
if (isset($_GET["machine"]))
	$machine = (int)$_GET["machine"];
if (isset($_GET["suiteVersion"]))
	$suiteVersion = (int)$_GET["suiteVersion"];
?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
<meta http-equiv="content-language" content="en">
<title>ARE WE FAST YET?</title>
<link href="css/nv.d3.css" rel="stylesheet" type="text/css">
<link rel="stylesheet" title="Default Stylesheet" type="text/css" href="css/style.css">
<link rel="shortcut icon" href="http://www.arewefastyet.com/awfy_favicon.png">
<script type="text/javascript" src="/jquery/jquery-1.8.3.min.js"></script>
<script type="text/javascript" src="/jquery/jquery.ba-hashchange.min.js"></script>
<script type="text/javascript" src="/flot/jquery.flot.js"></script>
<script type="text/javascript" src="/flot/jquery.flot.selection.js"></script>
<script type="text/javascript" src="/data.php?file=master.js"></script>
<?php if ($suiteVersion == 0) { ?>
<script type="text/javascript" src="/overview/data.php?machine=<?=$machine?>"></script>
<?php } else { ?>
<script type="text/javascript" src="/overview/data-suite.php?machine=<?=$machine?>&suiteVersion=<?=$suiteVersion?>"></script>
<?php } ?>
<script type="text/javascript" src="/overview/js/overview.js"></script>
<script src="js/d3.v3.js"></script>
<script src="js/nv.d3.js"></script>
<script src="https://login.persona.org/include.js"></script>
</head>
<body>

<a id='personaLogin' href="javascript:doLogin()"><span>Login</span></a>
<a id='personaLogout' href="javascript:doLogout()" style='display: none;'><span>Logout</span></a>

<?php if ($suiteVersion == 0) { ?>
<script>
d3.select("body").append("h1").text(AWFYMaster["machines"][AWFYOverview["machine"]]["description"]);
d3.select("body").append("div").text("tested on " + new Date(AWFYOverview["stamp"] * 1000));

for (var i = 0; i < AWFYOverview["data"].length; i++) {
	var data = AWFYOverview["data"][i];
	console.log(data);
	var div = d3.select("body").append("div").attr('class','chart');
	if (data["suiteversionid"] == -1)
		continue;
	var suiteversion = AWFYMaster["suiteversions"][data["suiteversionid"]];
	var titel = suiteversion["name"];
	var direction = AWFYMaster["suites"][suiteversion["suite"]]["direction"]; 
	var scores = data2nv(data["scores"], direction);

	createGraph(div.append("div"), titel, scores);
	div.append("a").text("view subtests").attr("href", "?machine="+AWFYOverview["machine"]+"&suiteVersion="+data["suiteversionid"]);
	div.append("a").text("view history").attr("href","/#machine="+AWFYOverview["machine"]);
}
</script>
<?php } else { ?>
<script>
var suiteversion = AWFYMaster["suiteversions"][AWFYOverview["suiteVersion"]];
d3.select("body").append("h1")
  .text(AWFYMaster["machines"][AWFYOverview["machine"]]["description"] +
        " > " + suiteversion["name"]);
d3.select("body").append("div").text("tested on " + new Date(AWFYOverview["stamp"] * 1000));

for (var i = 0; i < AWFYOverview["data"].length; i++) {
	var data = AWFYOverview["data"][i];
	console.log(data);
	var div = d3.select("body").append("div").attr('class','chart');
	var titel = data["suitetest"];
	var direction = AWFYMaster["suites"][suiteversion["suite"]]["direction"]; 
	var scores = data2nv(data["scores"], direction);

	createGraph(div.append("div"), titel, scores);
	div.append("a").text("view history").attr("href","/#machine="+AWFYOverview["machine"]+"&view=single&suite="+suiteversion["suite"]+"&subtest="+data["suitetest"]);
}
</script>
<?php } ?>

<script>
	var url;
	if ((window.location + "").substr(0, 10) == "http://www")
	    url = "http://www.arewefastyet.com/auth.php";
	else
	    url = "http://arewefastyet.com/auth.php";

    // Listen on Persona events
    var request = false;
    var currentUser = document.cookie.replace(/(?:(?:^|.*;\s*)persona\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    navigator.id.watch({
      loggedInUser: currentUser == "" ? null : currentUser, 
      onlogin: function (assertion) {
        if(request) {
          window.location = url + "?persona=1&assertion=" + assertion;
        } else {
          //document.getElementById("personaLogout").style.display = "block";
          //document.getElementById("personaLogin").style.display = "none";
        }
      },
      onlogout: function () {
        if(request) {
          window.location = url + "?persona=1&logout=1";
        } else {
          //document.getElementById("personaLogout").style.display = "none";
          //document.getElementById("personaLogin").style.display = "block";
        }
      }
    });

<?php
	if (isset($_SESSION["persona"])) {
?>
		document.getElementById("personaLogout").style.display = "block";
		document.getElementById("personaLogin").style.display = "none";
<?php
	}
?>
    
    // Do login in
    var doLogin = function() {
      request = true;
      navigator.id.request();
    }
    
    // Do login out
    var doLogout = function() {
      request = true;
      navigator.id.logout();
    }
</script>
</body>
</html>
