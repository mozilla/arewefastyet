<?php
// vim: set ts=4 sw=4 tw=99 et:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

error_reporting(-1);

include "../internals.php";

init_database();

$machine = (int)$_GET["machine"];
$overview = Array();

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

$query = "SELECT suite_version_id FROM `awfy_score`
          WHERE build_id IN (".implode(",", $buildIds).")
          GROUP BY suite_version_id";
$results = mysql_query($query);
if (!$results || mysql_num_rows($results) < 1)
    die();
$suiteIds = Array();
while($row = mysql_fetch_array($results)) {
    $suiteIds[] = $row[0];
}

$data = Array();
for ($i=0; $i < count($suiteIds); $i++) {
    $scores = Array();
    for ($j = 0; $j < count($buildIds); $j++) {
        $query = "SELECT score FROM `awfy_score`
                  WHERE suite_version_id = ".$suiteIds[$i]." AND
                        build_id = ".$buildIds[$j]."
                  LIMIT 1";
        $results = mysql_query($query);
        if (!$results || mysql_num_rows($results) != 1)
            continue;
        $row = mysql_fetch_array($results);
        $scores[] = Array("buildid" => $buildIds[$j], "modeid" => $modeIds[$j], "score" => $row[0]);
    }
    $data[] = Array("suiteversionid" => $suiteIds[$i], "scores" => $scores);
}
$overview["data"] = $data;

echo "var AWFYOverview = ".json_encode($overview);
