<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");
init_database();

require_once("data-func.php");

require_once("../lib/RetriggerController.php");
require_once("../lib/DB/Regression.php");

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
	$db_regression = Regression::FromId($ids[$i]);
	if (!$db_regression) {
		$data[] = Array();
		continue;
	}
	$db_build = $db_regression->build();
	$db_run = $db_build->run();

	$db_prev_build = $db_regression->prev_build();

	$regression = array(
		"id" => $db_regression->id,
		"machine" => $db_run->machine_id(),
		"mode" => $db_build->mode_id(),
		"stamp" => $db_run->finish_stamp(),
		"cset" => $db_build->revision(),
		"bug" => $db_regression->bug(),
		"status" => $db_regression->status(),
		"build_id" => $db_build->id,
		"detector" => $db_run->detector(),
		"run_id" => $db_run->id,
		"prev_run_id" => $db_prev_build->run_id(),
		"scores" => array(),
		"retriggerable" => RetriggerController::retriggerable($db_run->machine_id(),
															  $db_build->mode_id())
	);

	$qScores = mysql_query("SELECT * FROM awfy_regression_score
						    WHERE regression_id = '".$regression["id"]."'") or die(mysql_error());
	while ($scores = mysql_fetch_assoc($qScores)) {
		$suite_version_id = get("score", $scores["score_id"], "suite_version_id");
		$score = array(
			"score_id" => $scores["score_id"],
			"suite_version" => $suite_version_id,
			"score" => get("score", $scores["score_id"], "score"),
            "noise" => $scores["noise"]
		);

		$qPrevScore = mysql_query("SELECT score
								   FROM awfy_score
								   WHERE build_id = ".$db_prev_build->id." AND
										 suite_version_id = ".$suite_version_id."
								   LIMIT 1") or die(mysql_error());
		if (mysql_num_rows($qPrevScore) == 1) {
			$prevScore = mysql_fetch_assoc($qPrevScore);
			$score["prev_score"] = $prevScore["score"];
			$score["prev_cset"] = $db_prev_build->revision();
		}

		$regression["scores"][] = $score;
	}
	$qScores = mysql_query("SELECT * FROM awfy_regression_breakdown
						    WHERE regression_id = '".$db_regression->id."'") or die(mysql_error());
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

		$qPrevScore = mysql_query("SELECT awfy_breakdown.score
								   FROM awfy_breakdown
								   LEFT JOIN awfy_score ON score_id = awfy_score.id
								   WHERE awfy_score.build_id = ".$db_prev_build->id." AND
										 suite_test_id = ".$suite_test_id."
								   LIMIT 1") or die(mysql_error());
		if (mysql_num_rows($qPrevScore) == 1) {
			$prevScore = mysql_fetch_assoc($qPrevScore);
			$score["prev_score"] = $prevScore["score"];
			$score["prev_cset"] = $db_prev_build->revision();
		}

		$regression["scores"][] = $score;
	}
	if (!$minimal) {
		$qStatus = mysql_query("SELECT * FROM awfy_regression_status
								WHERE regression_id = '".$db_prev_build->id."'
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
