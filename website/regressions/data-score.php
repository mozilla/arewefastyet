<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once(__DIR__."/../lib/internals.php");
check_permissions();

require_once("data-func.php");
init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$request->id = (int) $request->id;
if (!isset($request->subtest))
	$request->subtest = false;

if ($request->subtest == 1 || $request->subtest == 'true') {
	$query = awfy_query("SELECT mode_id, machine, finish_stamp as stamp, awfy_breakdown.score, suite_test_id, sort_order
                         FROM `awfy_breakdown`
                         LEFT JOIN awfy_score ON awfy_score.id = score_id
                         LEFT JOIN awfy_build ON awfy_build.id = awfy_score.build_id
                         LEFT JOIN awfy_run ON awfy_run.id = run_id
                         WHERE awfy_breakdown.id = ".$request->id);
    $data = mysql_fetch_assoc($query);

	$prev = prev_suite_test($data["sort_order"], $data["machine"],
				            $data["mode_id"], $data["suite_test_id"]);
	if (count($prev) == 1)
		$data["prev_score"] = $prev[0]["score"];

	$data["suite_version_id"] = get("suite_test", $data["suite_test_id"], "suite_version_id");
	$data["suite_test"] = get("suite_test", $data["suite_test_id"], "name");

	die(json_encode($data));
} else {
	$query = awfy_query("SELECT mode_id, machine, finish_stamp as stamp, score, suite_version_id, sort_order
                         FROM `awfy_score`
                         LEFT JOIN awfy_build ON awfy_build.id = build_id
                         LEFT JOIN awfy_run ON awfy_run.id = run_id
                         WHERE awfy_score.id = ".$request->id);
    $data = mysql_fetch_assoc($query);

	$prev = prev_($data["sort_order"], $data["machine"],
			      $data["mode_id"], $data["suite_version_id"]);
	if (count($prev) == 1)
		$data["prev_score"] = $prev[0]["score"];

	die(json_encode($data));
}
