<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");
require_once("data-func.php");
init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$request->id = (int) $request->id;
if (!isset($request->subtest))
	$request->subtest = false;

if ($request->subtest == 1 || $request->subtest == 'true') {
	$query = mysql_query("SELECT mode_id, machine, stamp, score, suite_test_id
                          FROM `awfy_breakdown`
                          LEFT JOIN awfy_score ON awfy_score.id = score_id
                          LEFT JOIN awfy_build ON awfy_build.id = awfy_score.build_id
                          LEFT JOIN awfy_run ON awfy_run.id = run_id
                          WHERE awfy_breakdown.id = ".$request->id) or die(mysql_error());
    $data = mysql_fetch_assoc($query);

	$prev = prev_suite_test($data["stamp"], $data["machine"],
				            $data["mode_id"], $data["suite_test_id"]);
	if (count($prev) == 1)
		$data["prev_score"] = $prev[0]["score"];

	$data["suite_version_id"] = get("suite_test", $data["suite_test_id"], "suite_version_id");
	$data["suite_test"] = get("suite_test", $data["suite_test_id"], "name");

	die(json_encode($data));
} else {
	$query = mysql_query("SELECT mode_id, machine, stamp, score, suite_version_id
                          FROM `awfy_score`
                          LEFT JOIN awfy_build ON awfy_build.id = build_id
                          LEFT JOIN awfy_run ON awfy_run.id = run_id
                          WHERE awfy_score.id = ".$request->id) or die(mysql_error());
    $data = mysql_fetch_assoc($query);

	$prev = prev_($data["stamp"], $data["machine"],
			      $data["mode_id"], $data["suite_version_id"]);
	if (count($prev) == 1)
		$data["prev_score"] = $prev[0]["score"];

	die(json_encode($data));
}
