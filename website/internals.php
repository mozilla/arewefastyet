<?php
// vim: set ts=4 sw=4 tw=99 et:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
session_start();

function init_database()
{
    mysql_connect("localhost", "***", "***") or die("ERROR: " . mysql_error());
    mysql_select_db("dvander") or die("ERROR: " . mysql_error());
}

function has_permissions()
{
	if (!isset($_SESSION['persona']))
		return false;

	# Test here which persons have permission to see all benchmarks
	if ($_SESSION['persona'] == "hv1989@gmail.com")
		return true;
	if ($_SESSION['persona'] == "hverschore@mozilla.com")
		return true;

	return false;
}

function GET_int($name)
{
    if (isset($_GET[$name]))
        return intval($_GET[$name]);
    return 0;
}

function GET_string($name)
{
    if (isset($_GET[$name]))
        return $_GET[$name];
    return "";
}

function find_vendor_of_mode_id($mode_id)
{
    $query = "SELECT vendor_id FROM awfy_mode
              WHERE id = $mode_id";
    $results = mysql_query($query);
    if (!$results || mysql_num_rows($results) < 1)
        return 0;
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function find_mode($mode)
{
    $query = "SELECT id FROM awfy_mode
              WHERE mode = '" . mysql_real_escape_string($mode) . "'";
    $results = mysql_query($query);
    if (!$results || mysql_num_rows($results) < 1)
        return -1;
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function find_build($run_id, $mode_id)
{
    $query = "SELECT id FROM awfy_build
              WHERE run_id = $run_id and mode_id = $mode_id";
    $results = mysql_query($query);
    if (!$results || mysql_num_rows($results) < 1)
        return 0;
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function find_suite($suite)
{
    $query = "SELECT id FROM awfy_suite
              WHERE name = '" . mysql_real_escape_string($suite) . "'";
    $results = mysql_query($query);
    if (!$results || mysql_num_rows($results) < 1)
        return -1;
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function find_or_add_suite_version($suite, $version)
{
    $suite_id = find_suite($suite);
    if ($suite_id == -1)
        return -1;
    $query = "select id from awfy_suite_version where suite_id = $suite_id and name = '$version'";
    $results = mysql_query($query);
    if (!$results || mysql_num_rows($results) < 1) {
        $query = "insert into awfy_suite_version (suite_id, name) values($suite_id, '$version')";
        mysql_query($query);
        return mysql_insert_id();
    }
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function find_or_add_test($suite_version_id, $name)
{
    $name = mysql_real_escape_string($name);
    $query = "select id from awfy_suite_test where suite_version_id = $suite_version_id and name = '$name'";
    $results = mysql_query($query);
    if (!$results || mysql_num_rows($results) < 1) {
        $query = "insert into awfy_suite_test (suite_version_id, name) values($suite_version_id, '$name')";
        mysql_query($query);
        return mysql_insert_id();
    }
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function awfy_query($query)
{
    $result = mysql_query($query) or die(mysql_error());
    return $result;
}

function GET_run_id($name)
{
    $runid = GET_int($name);
    $results = mysql_query("SELECT id from awfy_run WHERE id = $runid AND status = 0");
    if (!$results || mysql_num_rows($results) < 1)
        return 0;
    return $runid;
}
