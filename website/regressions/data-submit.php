<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

require_once("data-func.php");
init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$request->id = (int) $request->id;
if (!isset($request->subtest))
	$request->subtest = false;

$prev_build_id = 0;
if ($request->subtest == 1 || $request->subtest == 'true') {
	$query = awfy_query("SELECT mode_id, machine, sort_order, awfy_breakdown.score, suite_test_id, build_id
                         FROM `awfy_breakdown`
                         LEFT JOIN awfy_score ON awfy_score.id = score_id
                         LEFT JOIN awfy_build ON awfy_build.id = awfy_score.build_id
                         LEFT JOIN awfy_run ON awfy_run.id = run_id
                         WHERE awfy_breakdown.id = ".$request->id);
    $data = mysql_fetch_assoc($query);

	$prev = prev_suite_test($data["sort_order"], $data["machine"],
				            $data["mode_id"], $data["suite_test_id"]);
	if (count($prev) == 1) {
		$prev_breakdown_id = $prev[0]["id"];
		$prev_score_id = get("breakdown", $prev_breakdown_id, "score_id");
		$prev_build_id = get("score", $prev_score_id, "build_id");
	}
	$build_id = $data["build_id"];
} else {
	$query = awfy_query("SELECT mode_id, machine, sort_order, score, suite_version_id, build_id
                         FROM `awfy_score`
                         LEFT JOIN awfy_build ON awfy_build.id = build_id
                         LEFT JOIN awfy_run ON awfy_run.id = run_id
                         WHERE awfy_score.id = ".$request->id);
    $data = mysql_fetch_assoc($query);

	$prev = prev_($data["sort_order"], $data["machine"],
			      $data["mode_id"], $data["suite_version_id"]);
	if (count($prev) == 1) {
		$prev_score_id = $prev[0]["id"];
		$prev_build_id = get("score", $prev_score_id, "build_id");
	}
	$build_id = $data["build_id"];
}

$query = awfy_query("SELECT id FROM awfy_regression
					 WHERE build_id = ".$build_id." AND
                           prev_build_id = ".$prev_build_id);
if (mysql_num_rows($query) == 0) {
	awfy_query("INSERT INTO awfy_regression
                (build_id, prev_build_id, status)
                VALUES
                (".$build_id.",".$prev_build_id.",'unconfirmed')");
	$regression_id = mysql_insert_id();
} else {
	$data = mysql_fetch_assoc($query);
	$regression_id = $data["id"];
}

if ($request->subtest == 1 || $request->subtest == 'true') {
	$suite_test_id = get("breakdown", $request->id, "suite_test_id");
	$suite = get("suite_test", $suite_test_id, "name");

	$query = awfy_query("SELECT id FROM awfy_regression_breakdown
				         WHERE breakdown_id = ".$request->id." AND
                               regression_id = ".$regression_id);
	if (mysql_num_rows($query) == 0) {
		awfy_query("INSERT INTO awfy_regression_breakdown
                    (regression_id, breakdown_id) VALUES (".$regression_id.",".$request->id.")");
	}
} else {
	$suite_version_id = get("score", $request->id, "suite_version_id");
	$suite = get("suite_version", $suite_version_id, "name");

	$query = awfy_query("SELECT id FROM awfy_regression_score
				         WHERE score_id = ".$request->id." AND
                               regression_id = ".$regression_id);
	if (mysql_num_rows($query) == 0) {
		awfy_query("INSERT INTO awfy_regression_score
                    (regression_id, score_id) VALUES (".$regression_id.",".$request->id.")");
	}
}

awfy_query("INSERT INTO awfy_regression_status
			(regression_id, name, extra, stamp) VALUES
			(".$regression_id.",'".username()."','Reported ".$suite." regression', UNIX_TIMESTAMP())");

echo $regression_id;
