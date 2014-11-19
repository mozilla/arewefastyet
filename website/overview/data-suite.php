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
$runId = $row[0];
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

$query = "SELECT id, mode_id FROM `awfy_build`
          WHERE run_id = $runId";
$results = mysql_query($query);
if (!$results || mysql_num_rows($results) < 1)
    die();
$buildIds = Array();
$modeIds = Array();
while($row = mysql_fetch_array($results)) {
    $buildIds[] = $row[0];
    $modeIds[] = $row[1];
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
                  WHERE suite_test_id = ".$suiteTestId." AND
                        build_id = ".$buildIds[$j]."
                  LIMIT 1";
        $results = mysql_query($query);
        if (!$results || mysql_num_rows($results) != 1)
            continue;
        $row = mysql_fetch_array($results);
        $scores[] = Array("buildid" => $buildIds[$j], "modeid" => $modeIds[$j], "score" => $row[0]);
    }
    $data[] = Array("suitetest" => $suiteTest, "scores" => $scores);
}
$overview["data"] = $data;

echo "var AWFYOverview = ".json_encode($overview);
