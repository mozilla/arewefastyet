<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");
require_once("data-func.php");
init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

if (!empty($request->score_id)) {
	$suite_version_id = get("score", (int)$request->score_id, "suite_version_id");
	$build_id = get("score", (int)$request->score_id, "build_id"); 
	$run_id = get("build", $build_id, "run_id"); 
	$stamp = get("run", $run_id, "stamp"); 
	$machine = get("run", $run_id, "machine"); 
	$mode_id = get("build", $build_id, "mode_id"); 

	if ($request->type == "prev") {
		$prev = prev_($stamp, $machine, $mode_id, $suite_version_id, (int)$request->amount);
		$last = array_pop($prev);
	} else {
		$next = next_($stamp, $machine, $mode_id, $suite_version_id, (int)$request->amount);
		$last = array_pop($next);
	}
	$build_id = get("score", $last["id"], "build_id"); 
} else {
	$suite_test_id = get("breakdown", (int)$request->breakdown_id, "suite_test_id");
	$score_id = get("breakdown", (int)$request->breakdown_id, "score_id"); 
	$build_id = get("score", (int)$score_id, "build_id"); 
	$run_id = get("build", $build_id, "run_id"); 
	$stamp = get("run", $run_id, "stamp"); 
	$machine = get("run", $run_id, "machine"); 
	$mode_id = get("build", $build_id, "mode_id"); 

	if ($request->type == "prev") {
		$prev = prev_suite_test($stamp, $machine, $mode_id, $suite_test_id, (int)$request->amount);
		$last = array_pop($prev);
	} else {
		$next = next_suite_test($stamp, $machine, $mode_id, $suite_test_id, (int)$request->amount);
		$last = array_pop($next);
	}
	$score_id = get("breakdown", $last["id"], "score_id"); 
	$build_id = get("score", $score_id, "build_id"); 
}

$run_id = get("build", $build_id, "run_id"); 
$stamp = get("run", $run_id, "stamp"); 

echo $stamp;
