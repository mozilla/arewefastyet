<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");
require_once("../lib/RetriggerController.php");
require_once("../lib/VersionControl/HGWeb.php");
require_once("../lib/DB/ControlTasks.php");
require_once("../lib/DB/Mode.php");

init_database();

$machines = Array(); 
$control_tasks = ControlTasks::all();
foreach ($control_tasks as $control_task) {
	$machine_id = $control_task->machine_id();
    $mode_id = $control_task->mode_id() ? $control_task->mode_id() : Mode::FromMode("jmim")->id; 
	if (RetriggerController::retriggerable($machine_id, $mode_id)) {
		$description = $control_task->machine()->description();
		if ($control_task->mode_id())
			$description .= " - ".$control_task->mode()->name();

		$machines[$description] = Array(
			"machine_id" => $control_task->machine()->id,
			"mode_id" => $mode_id
		);
	}
}
echo JSON_encode($machines);
