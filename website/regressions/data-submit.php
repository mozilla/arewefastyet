<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");
require_once("data-func.php");
init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$request->id = (int) $request->id;
if (!isset($request->subtest))
	$request->subtest = false;

if ($request->subtest == 1 || $request->subtest == 'true') {
	$build_id = get("breakdown", $request->id, "build_id");
	$suite_test_id = get("breakdown", $request->id, "suite_test_id");
	$suite = get("suite_test", $suite_test_id, "name");

	$query = mysql_query("SELECT id FROM awfy_regression_breakdown
				          WHERE breakdown_id = ".$request->id);
	if (mysql_num_rows($query) == 0) {
		mysql_query("INSERT INTO awfy_regression_breakdown
                     (build_id, breakdown_id) VALUES (".$build_id.",".$request->id.")");
	}
} else {
	$build_id = get("score", $request->id, "build_id");
	$suite_version_id = get("score", $request->id, "suite_version_id");
	$suite = get("suite_version", $suite_version_id, "name");

	$query = mysql_query("SELECT id FROM awfy_regression_score
				          WHERE score_id = ".$request->id);
	if (mysql_num_rows($query) == 0) {
		mysql_query("INSERT INTO awfy_regression_score
                     (build_id, score_id) VALUES (".$build_id.",".$request->id.")");
	}
}

$query = mysql_query("SELECT id FROM awfy_regression
					  WHERE build_id = ".$build_id);
if (mysql_num_rows($query) == 0) {
	mysql_query("INSERT INTO awfy_regression
                 (build_id, status) VALUES (".$build_id.",'unconfirmed')");
	$regression_id = mysql_insert_id();
} else {
	$data = mysql_fetch_assoc($query);
	$regression_id = $data["id"];
}

mysql_query("INSERT INTO awfy_regression_status
			 (regression_id, name, extra, stamp) VALUES
			 (".$regression_id.",'".username()."','Reported ".$suite." regression', UNIX_TIMESTAMP())");

echo $regression_id;
