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
 <script src="/googlelogin.js"></script>
</head>
<body>

<header>
  <div class='container'>
    <h1><a href='#'>AreWeFastYet</a></h1>
    <div class='rightSide'>
	  <div><a href="http://blog.mozilla.org/javascript"><span>Blog</span></a></div>
	  <div><a href="/overview"><span>Overview</span></a></div>
	  <div><a href="/schedule.php"><span>Schedule</span></a></div>
      <div class='userMenu'>
	    <div class="g-signin2" data-onsuccess="onSignIn"></div>
      </div>
    </div>
  </div>
</header>

<div class='dashboard_content'>
<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("lib/internals.php");
check_permissions();

require_once("lib/DB/Mode.php");
require_once("lib/DB/Machine.php");
require_once("lib/DB/TaskQueue.php");
require_once("lib/DB/ControlTasks.php");

init_database();

function time_diff($ptime1, $ptime2) {
	$sec = $ptime2 - $ptime1;
	$string = "";
	if ($sec > 3600) {
		$hours = floor($sec / 3600);
		$sec -= $hours * 3600;
		$string .= $hours."h";
	}
	if ($sec > 60) {
		$mins = floor($sec / 60);
		$sec -= $mins * 60;
		$string .= $mins."min";
	}
	if (empty($string)) {
		$string .= $sec."s";
	}
	return $string;
}
function time_ago($ptime, $reference = null) {
	if (!$reference)
		$reference = time();
    $etime = $reference - $ptime;
     
    if ($etime < 1) {
        return '0 seconds';
    }
     
    $interval = array( 12 * 30 * 24 * 60 * 60  =>  'year',
                30 * 24 * 60 * 60       =>  'month',
                24 * 60 * 60            =>  'day',
                60 * 60                 =>  'hour',
                60                      =>  'minute',
                1                       =>  'second'
                );
     
    foreach ($interval as $secs => $str) {
        $d = $etime / $secs;
        if ($d >= 1) {
            $r = round($d);
            return $r . ' ' . $str . ($r > 1 ? 's' : '');
        }
    }
}

if ($task_id = GET_int("start")) {
	$task = QueuedTask::FromId($task_id);
	if ($task && $task->finish_time() == 0 && $task->start_time() == 0) {
		$task->set_available_time(time());
		if ($task->control_tasks_id() != 0) {
			$control_tasks = new ControlTasks($task->control_tasks_id());
			$control_tasks->updateLastScheduled();
		}
	}
}

if ($task_id = GET_int("delete")) {
	$task = QueuedTask::FromId($task_id);
	if ($task && $task->finish_time() == 0 && $task->start_time() == 0)  {
		$task->setStarted();
		$task->reportError("Cancelled by user.");
	}
}

echo "<table width='100%'>";
echo "<thead>";
echo "<th>Control unit id</th>";
echo "<th>Machine and mode";
echo "<th>Status";
echo "<th>Queue";
echo "<th>Last finished task";
echo "</thead>";
$qUnits = awfy_query("SELECT * FROM control_unit");
while($unit = mysql_fetch_object($qUnits)) {
	echo "<tr><td>".$unit->id;

	$qTasks = awfy_query("SELECT * FROM control_tasks WHERE control_unit_id =".$unit->id);
	if (mysql_num_rows($qTasks) == 0) {
		echo "<td>/";
	} else {
		echo "<td>";
		while($task = mysql_fetch_object($qTasks)) {
			$machine = Machine::FromId($task->machine_id);
			$mode = Mode::FromId($task->mode_id);

			echo "(".$task->id.") ";
			echo $machine->description();
			echo $mode ? " with ".$mode->name() : "";
			echo "<br>";
		}
	}

	$queue = new TaskQueue($unit->id);
	echo "<td>";
	if ($task = $queue->last_finished_task()) {
		if (time() - $task->finish_time() > 60*60*24)
			echo "<span style='color:red'>";
		else
			echo "<span>";
	} else {
		echo "<span>";
	}

	if ($queue->has_active_task()) {
		$active = $queue->get_active_task();
		echo "Running";
		if ($active->control_tasks_id())
			echo " (".$active->control_tasks_id().")";
		echo "<span title='".date("G:i d/m/Y", $active->start_time())."'> started ".time_ago($active->start_time())." ago</span>";
	} else {
		echo "Not running";
	}
	echo "</span>";

	echo "<td>";
	if ($queue->has_queued_tasks()) {
		$tasks = $queue->get_queued_tasks();
		foreach ($tasks as $task) {
            $start = $task->available_time();

			echo "<div style='float:right'>";
			if ($start > time())
				echo "<a href='?start=".$task->id."'>(schedule now)</a>";
			echo " <a href='?delete=".$task->id."'>(delete)</a>";
			echo "</div>";

			if ($task->control_tasks_id()) {
				echo "- Queued job ({$task->control_tasks_id()})";
			} else {
				echo "- Customized job";
			}

			if ($start <= time())
				echo " ready";
			else
				echo " in ".time_diff(time(), $start);

			echo "<br />";
		}
	} else {
		echo "- empty -";
	}

	echo "<td>";
	if ($tasks = $queue->last_tasks()) {
		$tasks = array_reverse($tasks);
		foreach ($tasks as $task) {
			$color = "grey";
			if ($task->hasError()) {
				$color = "red";
			} elseif ($task->finish_time() > 0) {
				if (strpos($task->output(), "Traceback") !== false)
					$color = "orange";
				else
					$color = "green";
			} elseif ($task->start_time() > 0) {
				$color = "black";
			}
			echo "<a href='task_info.php?id={$task->id}' style='color:{$color}'>({$task->control_tasks_id()})</a> ";
			echo "</font>";
		}
	} else {
		echo "/";
	}

	
}
echo "</table>";
?>
</div>
</body>
</html>
