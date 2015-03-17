<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");

init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

for ($i=0; $i < count($request->machines); $i++)
	$request->machines[$i] = (int)$request->machines[$i]; 
$machines = join(",", $request->machines);
for ($i=0; $i < count($request->modes); $i++)
	$request->modes[$i] = (int)$request->modes[$i]; 
$modes = join(",", $request->modes);

#TODO
date_default_timezone_set("Europe/Brussels");

function prev_($stamp, $machine, $mode, $suite) {
    $query = mysql_query("SELECT score, cset
					      FROM awfy_score
					      INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
					      INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
					      WHERE stamp < $stamp AND
					       	 machine = $machine AND
					       	 mode_id = $mode AND
					       	 suite_version_id = $suite AND
					       	 status = 1
					      ORDER BY stamp DESC
					      LIMIT 1") or die(mysql_error());
    if (mysql_num_rows($query) < 1)
        return 0;
	$output = mysql_fetch_assoc($query) or die(mysql_error());
	return $output;
}
function get($db, $id, $field) {
	$query = mysql_query("SELECT $field FROM awfy_$db
						  WHERE id = $id
						  LIMIT 1");
	$output = mysql_fetch_assoc($query) or die(mysql_error());
	return $output[$field];
}

$where = array();
if (!empty($machines))
	$where[] = "machine in ($machines)"; 
if (!empty($modes))
	$where[] = "mode_id in ($modes)"; 

$query = mysql_query("SELECT awfy_regression.id, machine, mode_id, awfy_run.stamp, build_id, cset, bug
                      FROM awfy_regression
                      INNER JOIN awfy_build ON build_id = awfy_build.id
                      INNER JOIN awfy_run ON run_id = awfy_run.id
					  WHERE ".(join(" AND ", $where))."
                      ORDER BY awfy_run.stamp ASC
                      LIMIT 100") or die(mysql_error());
$data = Array();
while ($output = mysql_fetch_assoc($query)) {
	$qStatus = mysql_query("SELECT status from awfy_regression_status
							WHERE regression_id = ".$output["id"]."
							ORDER BY stamp DESC
							LIMIT 1") or die(mysql_error());
	$status = mysql_fetch_assoc($qStatus);
	if (!in_array($status["status"], $request->states))
		continue;
	$regression = array(
		"id" => $output["id"],
		"machine" => $output["machine"],
		"mode" => $output["mode_id"],
		"stamp" => $output["stamp"],
		"cset" => $output["cset"],
		"bug" => $output["bug"],
		"scores" => array()
	);
	$qScores = mysql_query("SELECT * FROM awfy_regression_score
						    WHERE build_id = '".$output["build_id"].")'") or die(mysql_error());
	while ($scores = mysql_fetch_assoc($qScores)) {
		$suite_version_id = get("score", $scores["score_id"], "suite_version_id");
        $prev = prev_($output["stamp"], $output["machine"],
                     $output["mode_id"], $suite_version_id);
		$regression["scores"][] = array(
			"suite_version" => $suite_version_id,
            "prev_score" => $prev["score"],
            "prev_cset" => $prev["cset"],
			"score" => get("score", $scores["score_id"], "score")
		);
	}
	$qStatus = mysql_query("SELECT * FROM awfy_regression_status
						    WHERE regression_id = '".$output["id"]."'
							ORDER BY stamp DESC
							LIMIT 1") or die(mysql_error());
	$status = mysql_fetch_assoc($qStatus);
	$regression["status"] = $status["status"];
	$regression["status_extra"] = $status["extra"];

	$data[] = $regression;
}

echo json_encode($data);
