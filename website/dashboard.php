<?php

require_once("internals.php");
require_once("lib/DB/Mode.php");
require_once("lib/DB/Machine.php");
require_once("lib/DB/TaskQueue.php");

init_database();

function time_diff($ptime1, $ptime2) {
	$sec = $ptime2 - $ptime1;
	$string = "";
	if ($sec > 3600) {
		$hours = floor($sec / 3600);
		$sec -= $hours * 3600;
		$string = $hours."h";
	}
	if ($sec > 60) {
		$mins = floor($sec / 60);
		$sec -= $mins * 60;
		$string = $mins."min";
	}
	if (!isset($hours) && !isset($mins)) {
		$string = $sec."s";
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

echo "<table width='100%'>";
echo "<thead>";
echo "<th>Control unit id</th>";
echo "<th>Machine and mode";
echo "<th>Status";
echo "<th>Queue";
echo "<th>Last finished task";
echo "</thead>";
$qUnits = mysql_query("SELECT * FROM control_unit");
while($unit = mysql_fetch_object($qUnits)) {
	echo "<tr><td>".$unit->id;

	$qTasks = mysql_query("SELECT * FROM control_tasks WHERE control_unit_id =".$unit->id) or die(mysql_error());
	if (mysql_num_rows($qTasks) == 0) {
		echo "<td>/";
	} else {
		echo "<td>";
		while($task = mysql_fetch_object($qTasks)) {
			$machine = Machine::FromId($task->machine_id);
			$mode = Mode::FromId($task->mode_id);

			echo $machine->description();
			echo $mode ? " with ".$mode->name() : "";
			echo "<br>";
		}
	}

	$queue = new TaskQueue($unit->id);
	echo "<td>";
	if ($queue->has_active_task()) {
		$active = $queue->get_active_task();
		echo "running";
		echo "<span title='".date("G:i d/m/Y", $active->start_time())."'> started ".time_ago($active->start_time())." ago</span>";
	} else {
		echo "not running";
	}

	echo "<td>";
	if ($queue->has_queued_tasks()) {
		$tasks = $queue->get_queued_tasks();
		$count = count($tasks);
		echo $count." tasks";
		if ($count > 0 && !$queue->has_active_task()) {
			$min = $tasks[0]->available_time();
			foreach ($tasks as $task) {
				if ($min > $task->available_time())
					$min = $task->available_time();
			}
			if ($min < time())
				echo " starting immediately";
			else
				echo " starting in ".time_diff(time(), $min);
		}
	} else {
		echo "empty";
	}

	echo "<td>";
	if ($last = $queue->last_finished_task()) {
		echo "finished ";
		echo "<span title='".date("G:i d/m/Y", $last->finish_time())."'>".time_ago($last->finish_time())." ago, </span>";
		echo "(took ".time_diff($last->start_time(), $last->finish_time()).")";
		if ($last->hasError()) {
			echo " unsuccesfull (error: ".html_special_chars($last->error()).")";
		}
	} else {
		echo "/";
	}

	
}
echo "</table>";
