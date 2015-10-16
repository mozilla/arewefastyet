<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");
require_once("data-func.php");
init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$request->machine = (int) $request->machine;
$request->mode = (int) $request->mode;

if (isset($request->rev)) {
	$request->rev = preg_replace("/[^A-Za-z0-9]/", "", $request->rev);
	$query = mysql_query("SELECT awfy_build.id 
						  FROM `awfy_build`
						  LEFT JOIN awfy_run ON awfy_run.id = run_id
						  WHERE machine = ".$request->machine." AND
								mode_id = ".$request->mode." AND
								rev = ".$request->rev."
						  LIMIT 1
						 ") or die(mysql_error());
	$data = mysql_fetch_assoc($query);
} else {
	$query = mysql_query("SELECT awfy_build.id 
						  FROM `awfy_build`
						  LEFT JOIN awfy_run ON awfy_run.id = run_id
						  WHERE machine = ".$request->machine." AND
								mode_id = ".$request->mode." AND
                                status = 1
						  ORDER BY sort_order DESC
						  LIMIT 1") or die(mysql_error());
	$data = mysql_fetch_assoc($query);
}

$all_scores = Array();
$qScores = mysql_query("SELECT *
                        FROM awfy_score
			            WHERE build_id = ".$data["id"]) or die(mysql_error());
while ($scores = mysql_fetch_assoc($qScores)) {
	$score = array(
		"suite_version" => $scores["suite_version_id"],
		"score" => $scores["score"]
	);

	$all_scores[] = $score;
}

$qScores = mysql_query("SELECT awfy_breakdown.*
                        FROM awfy_breakdown
                        LEFT JOIN awfy_score ON awfy_score.id = score_id
			            WHERE build_id = ".$data["id"]) or die(mysql_error());
while ($scores = mysql_fetch_assoc($qScores)) {
	$suite_version_id = get("suite_test", $scores["suite_test_id"], "suite_version_id");
	$score = array(
		"suite_version" => $suite_version_id,
		"suite_test" => get("suite_test", $scores["suite_test_id"], "name"),
		"score" => $scores["score"]
	);

	$all_scores[] = $score;
}

die(json_encode($all_scores));
