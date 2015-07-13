<?php
// vim: set ts=4 sw=4 tw=99 et:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

include "../internals.php";

init_database();

$machine = (int)$_GET["machine"];
$suiteVersion = (int)$_GET["suiteVersion"];

$query = "SELECT id, stamp FROM `awfy_run`
          WHERE machine = $machine AND
                status = 1
          ORDER BY stamp DESC
          LIMIT 1";
$results = mysql_query($query);
if (!$results || mysql_num_rows($results) != 1)
    die();
$row = mysql_fetch_array($results);
$overview["machine"] = $machine;
$overview["stamp"] = $row[1];
$overview["suiteVersion"] = $suiteVersion;

if (!has_permissions()) {
	$query = "SELECT awfy_suite.id FROM `awfy_suite`
              LEFT JOIN awfy_suite_version on suite_id = awfy_suite.id
              WHERE awfy_suite_version.id = $suiteVersion AND
				    visible = 1
              LIMIT 1";
	$results = mysql_query($query);
	if (!$results || mysql_num_rows($results) != 1)
		die();
}

// Get all modes.
$query = "SELECT mode_id
		  FROM `awfy_build`
		  LEFT JOIN awfy_run ON run_id = awfy_run.id
		  WHERE machine = $machine
		  GROUP BY mode_id";
$results = mysql_query($query);
if (!$results || mysql_num_rows($results) < 1)
    die();
$buildIds = Array();
$modeIds = Array();
$stamps = Array();
while($row = mysql_fetch_array($results)) {
	$mode = $row[0];

	// Get last build of a specific mode (not older than 5 days from the newest result).
	$query = "SELECT awfy_build.id, stamp FROM `awfy_build`
			  LEFT JOIN awfy_run ON run_id = awfy_run.id
			  WHERE awfy_build.mode_id = $mode AND
                    machine = $machine AND
					stamp >= ".($overview["stamp"]-5*24*60*60)." AND
				    status = 1
			  ORDER BY stamp DESC
              LIMIT 1";
	$buildInfo = mysql_query($query) or die(mysql_error());
	if (!$buildInfo || mysql_num_rows($buildInfo) != 1)
		continue;
	$buildRow = mysql_fetch_array($buildInfo);
	$buildIds[] = $buildRow[0];
	$modeIds[] = $mode;
	$stamps[] = $buildRow[1];
}

$data = Array();

$query = "SELECT id, name FROM `awfy_suite_test`
          WHERE suite_version_id = $suiteVersion AND
                visible = 1";
$tests = mysql_query($query);
if (!$results || mysql_num_rows($tests) < 1)
    die();
while($row = mysql_fetch_array($tests)) {
	$suiteTestId = $row[0];
	$suiteTest = $row[1];
    $scores = Array();
    for ($j = 0; $j < count($buildIds); $j++) {
        $query = "SELECT score FROM `awfy_breakdown`
                  LEFT JOIN awfy_score ON awfy_score.id = score_id
                  WHERE suite_test_id = ".$suiteTestId." AND
                        awfy_score.build_id = ".$buildIds[$j]."
                  LIMIT 1";
        $results = mysql_query($query);
        if (!$results || mysql_num_rows($results) != 1)
            continue;
        $row = mysql_fetch_array($results);
        $scores[] = Array("buildid" => $buildIds[$j],
						  "modeid" => $modeIds[$j],
						  "score" => $row[0],
                          "stamp" => $stamps[$j]);
    }
    $data[] = Array("suitetest" => $suiteTest, "scores" => $scores);
}
$overview["data"] = $data;

echo "var AWFYOverview = ".json_encode($overview);
