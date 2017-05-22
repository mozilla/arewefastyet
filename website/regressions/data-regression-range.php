<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

require_once("../lib/DB/Regression.php");
require_once("../lib/VersionControl.php");

init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$id = (int)$request->id;

$regression = Regression::FromId($id);

$build = $regression->build() or throw_exception("Couldn't retrieve the build of regression $id.");
$prev_build = $regression->prev_build() or throw_exception("Couldn't retrieve the prev_build of regression $id.");


$regression->build()->revision();
$regression->prev_build()->revision();

$versionControl = VersionControl::forMode($build->mode_id());
$revisions = $versionControl->revisions($prev_build->revision(), $build->revision());

$data = Array();
foreach ($revisions as $revision) {
	$data[] = Array(
		"author" => $revision->author,
		"date" => $revision->date,
		"revision" => $revision->revision,
		"message" => $revision->message
	);
}
echo json_encode($data);
