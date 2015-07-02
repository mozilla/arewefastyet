<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");
init_database();

$subtest = GET_bool("subtest");
$id = GET_int("id");

if ($subtest) {
	$query = mysql_query("SELECT awfy_regression.id, noise, status
                          FROM `awfy_regression_breakdown`
                          LEFT JOIN awfy_regression
                          ON awfy_regression.id = awfy_regression_breakdown.regression_id
                          WHERE breakdown_id = ".$id);
} else {
	$query = mysql_query("SELECT awfy_regression.id, noise, status
                          FROM `awfy_regression_score`
                          LEFT JOIN awfy_regression
                          ON awfy_regression.id = awfy_regression_score.regression_id
                          WHERE breakdown_id = ".$id);
}

$data = Array();
if (mysql_num_rows($query) == 1) {
	$result = mysql_fetch_object($query);
    $data["id"] = $result->id;
	if ($result->noise)
		$data["status"] = "noise";
	else
		$data["status"] = $result->status;
} else {
	$data["status"] = "no";
}
echo json_encode($data); 
