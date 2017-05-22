<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

init_database();

require_once("../lib/ScoreTools.php");
require_once("../lib/DB/Score.php");
require_once("../lib/DB/Breakdown.php");

$postdata = file_get_contents("php://input");
$request = json_decode($postdata);

$score = isset($request->score_id) ? Score::FromId($request->score_id) :
                                     Breakdown::FromId($request->breakdown_id);
if (!$score)
    die();

if ($request->type == "prev")
    $list = ScoreTools::prevList($score, (int)$request->amount);
else
    $list = ScoreTools::nextList($score, (int)$request->amount);

$last = array_pop($list);
echo ScoreTools::build($last)->run()->approx_stamp();
