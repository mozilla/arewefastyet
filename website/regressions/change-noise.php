<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$regression_id = (int)$request->regression_id;

foreach($request->noise->score as $score_id => $noise) {
  $noise = (int)$noise;
  $score_id = (int)$score_id;
  $query = mysql_query("UPDATE awfy_regression_score SET noise = $noise
                        WHERE regression_id = $regression_id AND
                              score_id = $score_id
                       ") or die(mysql_error());
}

foreach($request->noise->breakdown as $score_id => $noise) {
  $noise = (int)$noise;
  $score_id = (int)$score_id;
  $query = mysql_query("UPDATE awfy_regression_breakdown SET noise = $noise
                        WHERE regression_id = $regression_id AND
                              breakdown_id = $score_id
                       ") or die(mysql_error());
}
