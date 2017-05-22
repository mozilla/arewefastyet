<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

require_once("../lib/RetriggerController.php");
require_once("../lib/VersionControl/HGWeb.php");
require_once("../lib/DB/ControlTasks.php");
require_once("../lib/DB/Mode.php");

init_database();
$machine_id = (int)$_GET["machine_id"];
$mode_id = (int)$_GET["mode_id"];

$retrigger = RetriggerController::fromMachine($machine_id, $mode_id);
if (count($retrigger->tasks) != 1)
	die("Machine doesn't support retriggering yet.");

foreach ($retrigger->tasks as $task) {
	$benchmarks = Array();
	foreach ($task->benchmarks() as $task_benchmark) {
		$benchmarks[] = $task_benchmark;
	}
	echo JSON_encode($benchmarks);
	die();
}

