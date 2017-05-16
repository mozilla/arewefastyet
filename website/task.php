<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");

if (!has_permissions()) {
    die("You need to be logged in.");
}

require_once("lib/RetriggerController.php");
require_once("lib/DB/TaskQueue.php");
require_once("lib/DB/QueuedTask.php");
require_once("lib/Slack.php");

init_database();

if ($unit = GET_int("unit")) {

    $queue = new TaskQueue($unit);
    if ($queue->has_active_task()) {
        Slack::log("requesting new task, while old task is still running!");
        $task = $queue->get_active_task();
        $task->reportError("Requested new task, while this task was still running.");
    }

    RetriggerController::fillQueue($unit);

    $task = $queue->get_oldest_available_queued_task();
	if (!$task) {
		echo json_encode(Array(
			"task" => "sleep 60",
			"id" => 0
		));
        sleep(5);
		die();
	}

    $task->setStarted();

    echo json_encode(Array(
        "task" => $task->task(),
        "id" => $task->id
    ));

    die();

} else if ($task_id = GET_int("finish")) {

    $task = new QueuedTask($task_id);
    $task->setFinished();
    if (isset($_POST["output"]))
		$task->setOutput($_POST["output"]);

	if ($task->hasEmail()) {
		mail($task->email(), "AreWeFastYet task ".$task_id." finished",
			"Task ".$task_id." has finished.\r\n".
			"You can see the results on https://arewefastyet.com/task_info.php?id=".$task_id);
	}

    die();
}
