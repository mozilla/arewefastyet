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
$status = mysql_real_escape_string($request->status);
$name = mysql_real_escape_string($request->name);
$query = awfy_query("UPDATE awfy_regression SET status = '$status' WHERE id = $regression_id");

$extra = "Changed status to ".$status;
$query = awfy_query("INSERT INTO awfy_regression_status
                     (regression_id, name, extra, stamp)
                     VALUES
                     ('$regression_id', '$name', '$extra', UNIX_TIMESTAMP())");
