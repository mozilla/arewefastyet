<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

require_once("data-func.php");
init_database();

$amount = Array();

$query = awfy_query("SELECT awfy_regression.id, build_id FROM awfy_regression
                  INNER JOIN awfy_build ON awfy_build.id = build_id
                  WHERE (mode_id = 14 OR
                         mode_id = 28 or
                         mode_id = 33 or
                         mode_id = 26 or
                         mode_id = 32 or
                         mode_id = 20) AND
                  status != 'fixed' AND status != 'improvement'");

while ($regs = mysql_fetch_object($query)) {
    $qScore = awfy_query("SELECT count(*) as count FROM awfy_regression_score
                           WHERE regression_id = ".$regs->id);
    $score = mysql_fetch_object($qScore);
    $qBreakdown = awfy_query("SELECT count(*) as count FROM awfy_regression_breakdown
                               WHERE regression_id = ".$regs->id);
    $breakdown = mysql_fetch_object($qBreakdown);
    $qDate = awfy_query("SELECT finish_stamp FROM awfy_build
                          LEFT JOIN awfy_run ON awfy_run.id = awfy_build.run_id
                          WHERE awfy_build.id = ".$regs->build_id);
    $date = mysql_fetch_object($qDate);
    $date_str = date("Y", $date->finish_stamp).",".(date("m", $date->finish_stamp)*1-1).",".date("d", $date->finish_stamp);

    $amount[$date_str] += $score->count + $breakdown->count;
}

echo "[";
$first = true;
foreach ($amount as $key => $value) {
    if (!$first)
        echo ',';
    echo '{"c":[{"v":"Date('.$key.')"},{"v":'.$value.'}]}';
    $first = false;
}
echo "]";

?>
