<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../internals.php");
require_once("data-func.php");
init_database();

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

for ($i=0; $i < count($request->machines); $i++)
	$request->machines[$i] = (int)$request->machines[$i]; 
$machines = join(",", $request->machines);
for ($i=0; $i < count($request->modes); $i++)
	$request->modes[$i] = (int)$request->modes[$i]; 
$modes = join(",", $request->modes);
for ($i=0; $i < count($request->states); $i++)
	$request->states[$i] = "'".mysql_real_escape_string($request->states[$i])."'"; 
$states = join(",", $request->states);
$bug = null;
if (isset($request->bug) && $request->bug !== "")
	$bug = (int)$request->bug;

#TODO
date_default_timezone_set("Europe/Brussels");

$where = array();
if (!empty($machines))
	$where[] = "machine in ($machines)"; 
if (!empty($modes))
	$where[] = "mode_id in ($modes)"; 
if (!empty($states))
	$where[] = "awfy_regression.status in ($states)"; 
if (!empty($bug))
	$where[] = "awfy_regression.bug = $bug"; 
if ($bug === 0)
	$where[] = "awfy_regression.bug = ''"; 

$query = mysql_query("SELECT awfy_regression.id, machine, mode_id, awfy_run.stamp, build_id, cset, bug
                      FROM awfy_regression
                      INNER JOIN awfy_build ON build_id = awfy_build.id
                      INNER JOIN awfy_run ON run_id = awfy_run.id
					  WHERE ".(join(" AND ", $where))."
                      ORDER BY awfy_run.stamp DESC") or die(mysql_error());
$data = Array();
while ($output = mysql_fetch_assoc($query)) {
	$data[] = $output["id"];
}

echo json_encode($data);
