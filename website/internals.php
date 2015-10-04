<?php
// vim: set ts=4 sw=4 tw=99 et:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
session_start();

class Config {
    // MySQL config
    public $mysql_host;
    public $mysql_username;
    public $mysql_password;
    public $mysql_db_name;

    // General Config
    public $data_folder;

    function Config($config_file_path)
    {
        $this->init($config_file_path);
    }

    function init($config_file_path)
    {
        // Read & Parse config file
        $config_array = parse_ini_file($config_file_path, true);
        $this->mysql_host     = $config_array["mysql"]["host"];
        $this->mysql_username = $config_array["mysql"]["user"];
        $this->mysql_password = $config_array["mysql"]["pass"];
        $this->mysql_db_name  = $config_array["mysql"]["name"];
        $this->data_folder    = $config_array["general"]["path"];
    }
}

function init_database()
{
    global $config;
    mysql_connect($config->mysql_host, $config->mysql_username, $config->mysql_password) or die("ERROR: " . mysql_error());
    mysql_select_db($config->mysql_db_name) or die("ERROR: " . mysql_error());
}

function username()
{
    if (!isset($_SESSION['persona']))
        return "guest";
    else
        return $_SESSION['persona'];
}

function has_permissions()
{
    if (!isset($_SESSION['persona']))
        return false;

    # Test here which persons have permission to see all benchmarks
    if ($_SESSION['persona'] == "hv1989@gmail.com")
        return true;
    if (preg_match("/^[0-9A-Za-z.]*@mozilla\.com$/", $_SESSION['persona']))
        return true;

    return false;
}

function GET_bool($name)
{
    if (isset($_GET[$name]))
        return $_GET[$name] === "true" || $_GET[$name] === '1';
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

function normalize($string)
{
    return preg_replace("/[^a-zA-Z0-9\s\.-]/", "", $string);
}

function find_or_add_suite_version($suite, $version)
{
    $suite = normalize($suite);
    $version = normalize($version);

    $suite_id = find_suite($suite);
    if ($suite_id == -1)
        return -1;
    if ($suite == "octane" && $version == "octane")
        $version = "octane 2.0.1";
    if ($suite == "ss" && $version == "ss")
        $version = "ss 1.0.1";
    if ($suite == "kraken" && $version == "kraken")
        $version = "kraken 1.1";
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
    $name = normalize($name);

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

// Init
$config = new Config("/etc/awfy-server.config");
