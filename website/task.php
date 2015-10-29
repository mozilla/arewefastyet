<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");

init_database();

if (isset($_GET["unit"]) && is_numeric($_GET["unit"])) {
	$unit = (int)$_GET["unit"];

	$qTask = mysql_query("SELECT *
                          FROM control_task_queue
                          WHERE control_unit_id = $unit AND busy = 1
                          ORDER BY id LIMIT 1");
	if (mysql_num_rows($qTask) != 0) {
		slack("requesting new task, while old task is still running!");
	}


    $qTask = mysql_query("SELECT *
                          FROM control_task_queue
                          WHERE control_unit_id = $unit and busy = 0
                          ORDER BY id LIMIT 1");
    if (mysql_num_rows($qTask) == 0) {
		$qTask = mysql_query("SELECT task FROM control_tasks WHERE control_unit_id = $unit");
        while ($task = mysql_fetch_object($qTask)) {
			mysql_query("INSERT INTO control_task_queue
                         (control_unit_id, task)
                         VALUES ($unit, '".mysql_escape_string($tasks->task)."')");
		}
	}

    $qTask = mysql_query("SELECT *
                          FROM control_task_queue
                          WHERE control_unit_id = $unit and busy = 0
                          ORDER BY id LIMIT 1");
	$task = mysql_fetch_object($qTask);
	echo json_encode(Array("task" => $task->task,
                           "id" => $task->id));

	mysql_query("UPDATE control_task_queue SET busy = 1 WHERE id = ".$task->id);

    die();

} else if (isset($_GET["finish"]) && is_numeric($_GET["finish"])) {
	$task_id = $_GET["finish"];
	mysql_query("DELETE FROM control_task_queue WHERE id = ".$task_id);

	die();
}
