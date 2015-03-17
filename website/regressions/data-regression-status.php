<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");

init_database();

$query = mysql_query("SELECT *
                      FROM awfy_regression_status
					  WHERE regression_id = '".(int)$_GET["regression_id"]."'
                      ORDER BY stamp DESC") or die(mysql_error());
$data = array();
while ($output = mysql_fetch_assoc($query)) {
	$data[] = $output;
}

echo json_encode($data);
