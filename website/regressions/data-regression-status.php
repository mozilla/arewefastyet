<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);


$query = awfy_query("SELECT *
                     FROM awfy_regression_status
                     WHERE regression_id = '".(int)$request->id."'
                     ORDER BY stamp DESC");

$data = array();
while ($output = mysql_fetch_assoc($query)) {
    $data[] = $output;
}

echo json_encode($data);
