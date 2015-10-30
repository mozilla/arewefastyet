<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");

init_database();

require_once("lib/DB/Run.php");
require_once("lib/DB/Build.php");
require_once("lib/DB/Mode.php");
require_once("lib/RunReporter.php");

// Start a full benchmark run. Request a token/number used to report/group
// benchmark scores.
if (GET_string("run") == 'yes') {
    $machine_id = GET_int('MACHINE');

    $run = RunReporter::createForMachine($machine_id);
    echo "id=".$run->id;

    die();
}

// Start an out of order run. Retriggering a particular mode.
if (GET_string("run") == 'ooo') {
    $machine_id = GET_int('MACHINE');
    $mode = Mode::FromMode(GET_string('name'));
    $revision = GET_string('revision');
    $run_before_id = GET_int('run_before_id');
    $run_after_id = GET_int('run_after_id');

    $run = RunReporter::createOutOfOrder($machine_id, $mode->id, $revision,
                                         $run_before_id, $run_after_id);
    echo "id=".$run->id;

    die();
}

// Finish a full benchmark run. Scores will only become visible from now on
// (when status equals 1).
if (GET_string("run") == 'finish') {
    $run_id = GET_int('runid');
    $status = GET_int('status');

    $run = new Run($run_id);
    if ($run->isFinished() || $run->hasError())
        throw new Error("Run was already finished or error'ed");

    $error = GET_string('error');
    $run->finish($status, $error);

    die();
}

if (GET_string("run") == 'addEngine') {
    $run = new Run(GET_int('runid'));
    $revision = GET_string('cset');
    $mode = Mode::FromMode(GET_string('name'));

    if ($run->isFinished() || $run->hasError())
        throw new Error("Run was already finished or error'ed");

    if ($run->isOutOfOrder()) {
        // out of order builds cannot add extra modes. The available
        // mode have already been added.
        if (!Build::withRunAndMode($run->id, $mode->id))
            $run->finish(0, "Tried to add extra modes to out of order run.");
        die();
    }

    Build::insert($run, $mode->id, $revision);

    die();
}

// Report that a slave is still awake when there are no benchmarks results
// to send.
if (GET_string('awake') == 'yes') {
    $MACHINE = GET_int('MACHINE');
    mysql_query("UPDATE awfy_machine
                 SET last_checked = UNIX_TIMESTAMP()
                 WHERE id = $MACHINE")
        or die("ERROR: " . mysql_error());
    die();
}

// Report score of a benchmark total or subtest.
$run_id = GET_int('run');
$run = new Run($run_id);
if ($run->isFinished() || $run->hasError())
    throw new Error("Run was already finished or error'ed");

$time = mysql_real_escape_string(GET_string('time'));
$mode_id = find_mode(GET_string('mode'));
$version = GET_string('suite');
$score = GET_int('score');
$build = find_build($run_id, $mode_id);
if (isset($_GET['version']))
    $version = GET_string('version');
$suite_version_id = find_or_add_suite_version(GET_string('suite'), $version);
if (GET_string('name') == '__total__') {
    $extra_info = htmlspecialchars(GET_string('extra_info'), ENT_QUOTES);
    mysql_query("INSERT INTO awfy_score
                 (build_id, suite_version_id, score, extra_info)
                 VALUES
                 ($build, $suite_version_id, $time, '$extra_info')")
        or die("ERROR: " . mysql_error());
    print("id=" . mysql_insert_id());
} else {
    $test_id = find_or_add_test($suite_version_id, GET_string('name'));
    mysql_query("INSERT INTO awfy_breakdown
                 (score_id, suite_test_id, score)
                 VALUES
                 ($score, $test_id, $time)")
        or die("ERROR: " . mysql_error());
}
