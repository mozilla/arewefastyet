<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");

init_database();

if (isset($_GET["machine"]) && is_numeric($_GET["machine"])) {
	$machine = (int)$_GET["machine"];

	$qTask = mysql_query("SELECT *
                          FROM control_tasks
                          WHERE control_machine_id = $machine AND busy = 1
                          ORDER BY id LIMIT 1"); 
	if (mysql_num_rows($qTask) != 0) {
		slack("requesting new task, while old task is still running!");
	}


	while (true) {
		$qTask = mysql_query("SELECT * 
						      FROM control_tasks
                              WHERE control_machine_id = $machine and busy = 0
                              ORDER BY id LIMIT 1"); 
		if (mysql_num_rows($qTask) != 0)
            break;
		$qTask = mysql_query("SELECT empty_task FROM control_machine WHERE id = $machine"); 
		$task = mysql_fetch_object($qTask);
		$task = $task->empty_task;
		$tasks = explode("===", $task);
		for ($i = 0; $i < count($tasks); $i++) {
			mysql_query("INSERT INTO control_tasks
                         (control_machine_id, task)
                         VALUES ($machine, '".mysql_escape_string($tasks[$i])."')"); 
		}
	}

	$task = mysql_fetch_object($qTask);
	echo json_encode(Array("task" => $task->task,
                           "id" => $task->id));

	mysql_query("UPDATE control_tasks SET busy = 1 WHERE id = ".$task->id); 

    die();

} else if (isset($_GET["finish"]) && is_numeric($_GET["finish"])) {
	$task_id = $_GET["finish"];
	mysql_query("DELETE FROM control_tasks WHERE id = ".$task_id); 

	die();
}
