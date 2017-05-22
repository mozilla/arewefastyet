<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

init_database();

require_once("data-func.php");

require_once("../lib/RetriggerController.php");
require_once("../lib/DB/Regression.php");
require_once("../lib/RegressionTools.php");
$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$regression = Regression::FromId((int)$request->id);

$inbetween = Array();
foreach (RegressionTools::inbetweenBuilds($regression) as $build) {
	$inbetween[] = $build->revision();
}
echo json_encode($inbetween);
