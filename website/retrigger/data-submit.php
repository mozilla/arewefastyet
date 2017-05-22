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
$revision = $_GET["revision"];
$benchmarks = $_GET["benchmarks"];

if (!ctype_alnum($revision))
	throw new Exception("Given revision is not alphanumeric.");

try {
	$retrigger = RetriggerController::fromMachine($machine_id, $mode_id);
	$runs = RetriggerController::computeBeforeAfterId($machine_id, $mode_id, $revision);
	$retrigger->convertToRevision($mode_id, $revision, $runs[0], $runs[1]);
	$retrigger->selectBenchmarks($benchmarks);
	$retrigger->enqueueNow();
} catch (Exception $e) {
    echo 'Caught exception: ',  $e->getMessage(), "\n";
}
