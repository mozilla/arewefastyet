<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");

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

    die();
}
