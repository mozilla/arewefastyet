<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("internals.php");

init_database();

if (isset($_GET['requests'])) {
    $MACHINE = GET_int('MACHINE');
    $query = mysql_query("SELECT * FROM awfy_request
                          WHERE finished = 0
                          AND machine = $MACHINE");
    $data = Array();
    while ($output = mysql_fetch_assoc($query)) {
        $data[] = $output;
    }
    echo json_encode($data);
    die();
}

// Start a full benchmark run. Request a token/number used to report/group
// benchmark scores.
if (isset($_GET['run']) && $_GET['run'] == 'yes') {
    // TODO: sort_order is not a date anymore. Adjust this logic to not take an
    // order, but only set this afterwards.
    $MACHINE = GET_int('MACHINE');
    $stamp = GET_int('stamp');
    $stamp = ($stamp != 0) ? $stamp : "UNIX_TIMESTAMP()";
    mysql_query("INSERT INTO awfy_run (machine, sort_order)
                 VALUES
                 ($MACHINE, $stamp)")
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
                     error = $error,
                     finish_stamp = UNIX_TIMESTAMP()
                 WHERE id = $runid")
        or die("ERROR: " . mysql_error());

    mysql_query("UPDATE awfy_request as request
                 JOIN awfy_build as build ON request.cset = build.cset
                 JOIN  awfy_run as run ON run.id = build.run_id
                                   AND run.machine = request.machine
                 SET finished = 1
                 WHERE run.id = $runid")
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
$score = GET_int('score');
$build = find_build($run, $mode_id);
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
