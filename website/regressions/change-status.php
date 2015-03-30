<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");

init_database();

if (!has_permissions())
	die();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$regression_id = (int)$request->regression_id;
$status = mysql_real_escape_string($request->status);
$name = mysql_real_escape_string($request->name);
$query = mysql_query("UPDATE awfy_regression SET status = '$status' WHERE id = $regression_id
                      ") or die(mysql_error());

$extra = "Changed status to ".$status;
$query = mysql_query("INSERT INTO awfy_regression_status
                      (regression_id, name, extra, stamp)
					  VALUES
					  ('$regression_id', '$name', '$extra', UNIX_TIMESTAMP())
                      ") or die(mysql_error());

