<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");
require_once("data-func.php");
init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$ids = array();
$single = true;
if (isset($request->ids)) {
	for ($i=0; $i < count($request->ids); $i++)
		$ids[] = (int)$request->ids[$i]; 
	$single = false;
} else {
	$ids[] = (int)$request->id; 
}
$minimal = isset($request->minimal) ? !!$request->minimal : false;

$data = array();
for ($i=0; $i < count($ids); $i++) {

	$query = mysql_query("SELECT awfy_regression.id, machine, mode_id, awfy_run.stamp,
                                 build_id, cset, bug, awfy_regression.status, detector
						  FROM awfy_regression
						  INNER JOIN awfy_build ON build_id = awfy_build.id
						  INNER JOIN awfy_run ON run_id = awfy_run.id
						  WHERE awfy_regression.id = ".$ids[$i]."
						  LIMIT 1") or die(mysql_error());
	$output = mysql_fetch_assoc($query);
	$regression = array(
		"id" => $output["id"],
		"machine" => $output["machine"],
		"mode" => $output["mode_id"],
		"stamp" => $output["stamp"],
		"cset" => $output["cset"],
		"bug" => $output["bug"],
		"status" => $output["status"],
		"build_id" => $output["build_id"],
		"detector" => $output["detector"],
		"scores" => array()
	);
	$qScores = mysql_query("SELECT * FROM awfy_regression_score
						    WHERE build_id = '".$output["build_id"]."'") or die(mysql_error());
	while ($scores = mysql_fetch_assoc($qScores)) {
		$suite_version_id = get("score", $scores["score_id"], "suite_version_id");
		$score = array(
			"score_id" => $scores["score_id"],
			"suite_version" => $suite_version_id,
			"score" => get("score", $scores["score_id"], "score"),
            "noise" => $scores["noise"]
		);

		if (!$minimal) {
			$prev = prev_($output["stamp"], $output["machine"],
						 $output["mode_id"], $suite_version_id);
			if (count($prev) == 1) {
				$score["prev_score"] = $prev[0]["score"];
				$score["prev_cset"] = $prev[0]["cset"];
			}
		}

		$regression["scores"][] = $score;
	}
	$qScores = mysql_query("SELECT * FROM awfy_regression_breakdown
						    WHERE build_id = '".$output["build_id"]."'") or die(mysql_error());
	while ($scores = mysql_fetch_assoc($qScores)) {
		$suite_test_id = get("breakdown", $scores["breakdown_id"], "suite_test_id");
		$suite_version_id = get("suite_test", $suite_test_id, "suite_version_id");
		$score = array(
			"breakdown_id" => $scores["breakdown_id"],
			"suite_version" => $suite_version_id,
			"suite_test" => get("suite_test", $suite_test_id, "name"),
			"score" => get("breakdown", $scores["breakdown_id"], "score"),
            "noise" => $scores["noise"]
		);

		if (!$minimal) {
			$prev = prev_suite_test($output["stamp"], $output["machine"],
									$output["mode_id"], $suite_test_id);
			if (count($prev) == 1) {
				$score["prev_score"] = $prev[0]["score"];
				$score["prev_cset"] = $prev[0]["cset"];
			}
		}

		$regression["scores"][] = $score;
	}
	if (!$minimal) {
		$qStatus = mysql_query("SELECT * FROM awfy_regression_status
								WHERE regression_id = '".$output["id"]."'
								ORDER BY stamp DESC
								LIMIT 1") or die(mysql_error());
		$status = mysql_fetch_assoc($qStatus);
		$regression["status_extra"] = $status["extra"];
	}

	$data[] = $regression;
}

if ($single)
	echo json_encode($data[0]);
else
	echo json_encode($data);
