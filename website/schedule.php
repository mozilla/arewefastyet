<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
 <meta http-equiv="content-type" content="text/html; charset=UTF-8">
 <meta http-equiv="content-language" content="en">
 <title>ARE WE FAST YET?</title>
 <link rel="stylesheet" title="Default Stylesheet" type="text/css" href="style.css">
 <link rel="shortcut icon" href="//www.arewefastyet.com/awfy_favicon.png">
<link href='//fonts.googleapis.com/css?family=Lato' rel='stylesheet' type='text/css'>
 <script type="text/javascript" src="jquery/jquery-1.8.3.min.js"></script>
 <script type="text/javascript" src="jquery/jquery.ba-hashchange.min.js"></script>
 <script type="text/javascript" src="flot/jquery.flot.js"></script>
 <script type="text/javascript" src="flot/jquery.flot.selection.js"></script>
 <script type="text/javascript" src="data.php?file=master.js"></script>
 <script type="text/javascript" src="awfy.js"></script>
 <script type="text/javascript" src="frontpage.js"></script>
 <script type="text/javascript" src="tooltip.js"></script>

  <script src="https://apis.google.com/js/platform.js"></script>
  <script src="googlelogin.js"></script>
</head>
<body>

<header>
  <div class='container'>
    <h1><a href='#'>AreWeFastYet</a></h1>
    <div class='rightSide'>
	  <div><a href="/"><span>Graphs</span></a></div>
	  <div><a href="http://h4writer.com"><span>Blog</span></a></div>
	  <div><a href="/overview"><span>Overview</span></a></div>
      <div class='userMenu'>
	    <div class="g-signin2" data-onsuccess="onSignIn"></div>
      </div>
    </div>
  </div>
</header>

<div class='container content'>
<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");
require_once("lib/DB/QueuedTask.php");
require_once("lib/DB/TaskRecipe.php");

init_database();
if (!has_permissions()) {
	die("You need to be logged in.");
} else if (isset($_POST["task"])) {

	$recipe = new TaskRecipe((int)$_POST["task"]);
	$task = $recipe->fill($_POST);
	$email = isset($_POST["email"]) ? username() : "";

	$id = QueuedTask::insert($recipe->control_unit_id(), $task, $email);

	echo "Task submitted. <br />Results will become visible on <a href='https://arewefastyet.com/task_info.php?id=$id'>https://arewefastyet.com/task_info.php?id=$id</a>";
} else {
	$recipes = TaskRecipe::all();
	$recipes_json = [];
	foreach ($recipes as $recipe) {
		$recipes_json[] = array(
			"id" => $recipe->id,
			"name" => $recipe->name(),
			"description" => $recipe->description(),
			"task" => $recipe->task(),
			"inputs" => $recipe->inputs()
		);
	}
	?>
	<script>
	var recipes = <?php echo json_encode($recipes_json); ?>
	</script>
		<form method=POST>
			<h2>Schedule a task</h2>
			<div class='dashboard_content'></div>
			<script src='schedule.js'></script>
			<script>init_schedule();</script>
		</form>
	<?php
}
?>
</div>
