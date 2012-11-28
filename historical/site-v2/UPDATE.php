<?php

require_once("internals.php");

init_database();

if (isset($_GET['run']) && $_GET['run'] == 'yes') {
    $CPU = mysql_real_escape_string(GET_string('CPU'));
    $OS = mysql_real_escape_string(GET_string('OS'));
    $MACHINE = GET_int('MACHINE');
    $CSET = mysql_real_escape_string(GET_string('CSET'));
    mysql_query("INSERT INTO fast_run (cpu, os, machine, stamp, cset)
                 VALUES
                 ('$CPU', '$OS', $MACHINE, UNIX_TIMESTAMP(), '$CSET')")
        or die("ERROR: " . mysql_error());
    print("id=" . mysql_insert_id());
} else if (isset($_GET['run']) && $_GET['run'] == 'finish') {
    $runid = GET_int('runid');
    $status = GET_int('status');
    if (isset($_GET['error']))
        $error = '\'' . mysql_real_escape_string(GET_string('error')) . '\'';
    else
        $error = 'NULL';
    mysql_query("UPDATE fast_run
                 SET status = $status,
                      error = $error
                 WHERE id = $runid")
        or die("ERROR: " . mysql_error());
} else if (isset($_GET['run']) && $_GET['run'] == 'addEngine') {
    $runid = GET_int('runid');
    $mode_id = find_mode(GET_string('name'));
    $cset = mysql_real_escape_string(GET_string('cset'));
    mysql_query("INSERT INTO awfy_build
            (run_id, mode_id, cset)
            VALUES
            ($runid, $mode_id, '$cset')")
        or die("ERROR: " . mysql_error());
} else {
    $name = mysql_real_escape_string(GET_string('name'));
    $time = mysql_real_escape_string(GET_string('time'));
    $suite_id = find_suite(GET_string('suite'));
    $mode_id = find_mode(GET_string('mode'));
    $run = GET_int('run');
    if ($name == '__total__') {
        mysql_query("INSERT INTO awfy_score
                     (run_id, suite_id, mode_id, score)
                     VALUES
                     ($run, $suite_id, $mode_id, $time)")
            or die("ERROR: " . mysql_error());
    } else {
        mysql_query("INSERT INTO awfy_breakdown
                     (run_id, suite_id, mode_id, test, score)
                     VALUES
                     ($run, $suite_id, $mode_id, '$name', $time)")
            or die("ERROR: " . mysql_error());
    }
}

?>
