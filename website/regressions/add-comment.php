<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once(__DIR__."/../lib/internals.php");
check_permissions();

init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$regression_id = mysql_real_escape_string($request->regression_id);
$name = mysql_real_escape_string($_SESSION['persona']);
$extra = mysql_real_escape_string($request->extra);

$query = awfy_query("INSERT INTO awfy_regression_status
                     (regression_id, name, extra, stamp)
					 VALUES
					 ('$regression_id', '$name', '$extra', UNIX_TIMESTAMP())
                     ");
