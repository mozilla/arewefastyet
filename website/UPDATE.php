<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");

init_database();

// Start a full benchmark run. Request a token/number used to report/group
// benchmark scores.
// (Note: cset is not used anymore. It is saved in awfy_build now)
if (isset($_GET['run']) && $_GET['run'] == 'yes') {
    $MACHINE = GET_int('MACHINE');
    mysql_query("INSERT INTO awfy_run (machine, stamp)
                 VALUES
                 ($MACHINE, UNIX_TIMESTAMP())")
        or die("ERROR: " . mysql_error());
    print("id=" . mysql_insert_id());
    die();
}

// Finish a full benchmark run. Scores will only become visible from now on
// (when status equals 1).
if (isset($_GET['run']) && $_GET['run'] == 'finish') {
    $runid = GET_run_id('runid');
    $status = GET_int('status');
    if (isset($_GET['error']))
        $error = '\'' . mysql_real_escape_string(GET_string('error')) . '\'';
    else
        $error = 'NULL';
    mysql_query("UPDATE awfy_run
                 SET status = $status,
                      error = $error
                 WHERE id = $runid")
        or die("ERROR: " . mysql_error());
    die();
}

if (isset($_GET['run']) && $_GET['run'] == 'addEngine') {
    $runid = GET_run_id('runid');
    $mode_id = find_mode(GET_string('name'));
    $cset = mysql_real_escape_string(GET_string('cset'));
    mysql_query("INSERT INTO awfy_build
            (run_id, mode_id, cset)
            VALUES
            ($runid, $mode_id, '$cset')")
        or die("ERROR: " . mysql_error());
    die();
}

// Report that a slave is still awake when there are no benchmarks results
// to send.
if (isset($_GET['awake']) && $_GET['awake'] == 'yes') {
    $MACHINE = GET_int('MACHINE');
    mysql_query("UPDATE awfy_machine
                 SET last_checked = UNIX_TIMESTAMP()
                 WHERE id = $MACHINE")
        or die("ERROR: " . mysql_error());
    die();
}

// Report score of a benchmark total or subtest.
$time = mysql_real_escape_string(GET_string('time'));
$mode_id = find_mode(GET_string('mode'));
$run = GET_run_id('run');
$version = GET_string('suite');
$build = find_build($run, $mode_id);
if (isset($_GET['version']))
    $version = GET_string('version');
$suite_version_id = find_or_add_suite_version(GET_string('suite'), $version);
if (GET_string('name') == '__total__') {
    mysql_query("INSERT INTO awfy_score
                 (build_id, suite_version_id, score)
                 VALUES
                 ($build, $suite_version_id, $time)")
        or die("ERROR: " . mysql_error());
} else {
    $test_id = find_or_add_test($suite_version_id, GET_string('name'));
    mysql_query("INSERT INTO awfy_breakdown
                 (build_id, suite_test_id, score)
                 VALUES
                 ($build, $test_id, $time)")
        or die("ERROR: " . mysql_error());
}
