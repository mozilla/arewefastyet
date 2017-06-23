<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once(__DIR__."/../lib/internals.php");
check_permissions();

require_once(__DIR__."/../lib/RetriggerController.php");

init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$machine_id = (int)$request->machine_id;
$mode_id = (int)$request->mode_id;
$revision = $request->revision;
$run_before_id = (int)$request->run_before_id;
$run_after_id = (int)$request->run_after_id;
$benchmarks = $request->benchmarks;

$retrigger = RetriggerController::fromMachine($machine_id, $mode_id);
$retrigger->convertToRevision($mode_id, $revision, $run_before_id, $run_after_id);
$retrigger->selectBenchmarks($benchmarks);
$retrigger->enqueueNow();
