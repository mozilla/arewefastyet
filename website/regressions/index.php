<?php

require_once("../lib/internals.php");
check_permissions();

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html ng-app="awfyApp">
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <meta http-equiv="content-language" content="en">
  <title>ARE WE FAST YET?</title>
  <link href="css/nv.d3.css" rel="stylesheet" type="text/css">
  <link rel="stylesheet" title="Default Stylesheet" type="text/css" href="css/bootstrap.css">
  <link rel="stylesheet" title="Default Stylesheet" type="text/css" href="css/style.css">
  <link rel="stylesheet" title="Default Stylesheet" type="text/css" href="css/main.css">
  <link href='//fonts.googleapis.com/css?family=Lato' rel='stylesheet' type='text/css'>
  <link rel="shortcut icon" href="../awfy_favicon.png">

  <script src="../data.php?file=master.js"></script>
  <script type="text/javascript" src="../jquery/jquery-1.8.3.min.js"></script>
  <script src="//ajax.googleapis.com/ajax/libs/angularjs/1.3.0/angular.js"></script>
  <script src="//ajax.googleapis.com/ajax/libs/angularjs/1.3.0/angular-route.js"></script>
  <script src="js/angular-ui.js"></script>
  <script src="https://login.persona.org/include.js"></script>
  <script src="js/persona.js"></script>
  <script src="js/moment.js"></script>
  <script type="text/javascript" src="js/ng-google-chart.js"></script>
  <script src="js/app.js"></script>
  <script src="js/controllers.js"></script>
  <script src="js/regressionservice.js"></script>

</head>
<body ng-controller="pageCtrl">

<header>
  <div class='container'>
    <h1><a href='#'>AreWeFastYet</a></h1>
    <div class='rightSide'>
	  <div><a href="http://h4writer.com"><span>Blog</span></a></div>
	  <div><a href="/"><span>Graphs</span></a></div>
	  <div><a href="/overview"><span>Overview</span></a></div>
      <div class='userMenu'>
        <a href="javascript:doPersonaLogin()" ng-if='!currentUser'><span>Login</span></a>
        <a href="javascript:doPersonaLogout()" ng-if='currentUser'><span>Logout</span></a>
      </div>
    </div>
  </div>
</header>

<div ng-controller='dialogCtrl'>
<div class='modal' ng-if="modaltemplate!=undefined" ng-click="closeDialog($event)">
  <div class='container' ng-include="modaltemplate"></div>
</div>
</div>

<div class='container content' ng-view></div>

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-58850314-2', 'auto');
  ga('send', 'pageview');
</script>

</body>
</html>
