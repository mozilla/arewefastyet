<?php
// vim: set ts=4 sw=4 tw=99 et:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
session_start();
session_write_close();

class Config {
    // MySQL config
    public $mysql_host;
    public $mysql_username;
    public $mysql_password;
    public $mysql_db_name;

    // General Config
    public $data_folder;

    function __construct($config_file_path)
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
        $this->mysql_db_name  = $config_array["mysql"]["db_name"];
        $this->data_folder    = $config_array["general"]["data_folder"];
        $this->slack_webhook  = $config_array["general"]["slack_webhook"];
    }
}

function throw_exception($exception) {
    throw new Exception($exception);
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

    return $_SESSION['persona'];
}

function has_permissions()
{
    if (!isset($_SESSION['persona']))
        return false;

    # Test here which persons have permission to see all benchmarks
    if (preg_match("/^[0-9A-Za-z.]*@mozilla\.com$/", $_SESSION['persona'])) {
        return true;
    }

    $split = explode("@", $_SESSION['persona'], 2);

    if ($split[0] == 'hv1989' && $split[1] == "gmail.com") {
        return true;
    }

    if ($split[0] == "evilpies" && $split[1] == "googlemail.com") {
        return true;
    }

    if ($split[0] == 'arai.unmht' && $split[1] == "gmail.com") {
        return true;
    }

    return false;
}

function check_permissions()
{
    if (!has_permissions()) {
        die('You must be logged in to visit this page.');
    }
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

function awfy_query($query)
{
    $result = mysql_query($query) or throw_exception("SQL Error: " . mysql_error());
    return $result;
}

function find_vendor_of_mode_id($mode_id)
{
    $query = "SELECT vendor_id FROM awfy_mode
              WHERE id = $mode_id";
    $results = awfy_query($query);
    if (!$results || mysql_num_rows($results) < 1)
        return 0;
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function find_mode($mode)
{
    $query = "SELECT id FROM awfy_mode
              WHERE mode = '" . mysql_real_escape_string($mode) . "'";
    $results = awfy_query($query);
    if (!$results || mysql_num_rows($results) < 1)
        return -1;
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function find_build($run_id, $mode_id)
{
    $query = "SELECT id FROM awfy_build
              WHERE run_id = $run_id and mode_id = $mode_id";
    $results = awfy_query($query);
    if (!$results || mysql_num_rows($results) < 1)
        return 0;
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

function find_suite($suite)
{
    $query = "SELECT id FROM awfy_suite
              WHERE name = '" . mysql_real_escape_string($suite) . "'";
    $results = awfy_query($query);
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
    $results = awfy_query($query);
    if (!$results || mysql_num_rows($results) < 1) {
        $query = "INSERT INTO awfy_suite_version
                  (suite_id, name)
                  VALUES($suite_id, '$version')";
        awfy_query($query);
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
    $results = awfy_query($query);
    if (!$results || mysql_num_rows($results) < 1) {
        $query = "INSERT INTO awfy_suite_test
                  (suite_version_id, name)
                  VALUES($suite_version_id, '$name')";
        awfy_query($query);
        return mysql_insert_id();
    }
    $row = mysql_fetch_array($results);
    return intval($row[0]);
}

if (!function_exists("mysql_connect")) {
    /* warning: fatal error "cannot redeclare" if a function was disabled in php.ini with disable_functions:
    disable_functions =mysql_connect,mysql_pconnect,mysql_select_db,mysql_ping,mysql_query,mysql_fetch_assoc,mysql_num_rows,mysql_fetch_array,mysql_error,mysql_insert_id,mysql_close,mysql_real_escape_string,mysql_data_seek,mysql_result
     */

    function mysql_connect($host, $username, $password){
        global $dbconnect;
        $dbconnect = mysqli_connect($host, $username, $password);
        return $dbconnect;
    }
    function mysql_pconnect($host, $username, $password){
        global $dbconnect;
        $dbconnect = mysqli_connect("p:".$host, $username, $password);
        return $dbconnect;
    }
    function mysql_select_db($db){
        global $dbconnect;
        return mysqli_select_db ( $dbconnect,$db );
    }
    function mysql_ping($dbconnect){
        return mysqli_ping ( $dbconnect );
    }
    function mysql_query($stmt){
        global $dbconnect;
        return mysqli_query ($dbconnect, $stmt );
    }
    function mysql_fetch_assoc($erg){
        return mysqli_fetch_assoc ($erg );
    }
    function mysql_num_rows($e){
        return mysqli_num_rows ($e );
    }
    function mysql_affected_rows($e=NULL){
        return mysqli_affected_rows ($e );
    }
    function mysql_fetch_array($e){
        return mysqli_fetch_array ($e );
    }
    function mysql_error(){
        global $dbconnect;
        return mysqli_error ($dbconnect);
    }
    function mysql_insert_id(){
        global $dbconnect;
        return mysqli_insert_id ($dbconnect);
    }
    function mysql_close(){
        return true;
    }
    function mysql_escape_string($s){
        global $dbconnect;
        return mysqli_real_escape_string($dbconnect,$s);
    }
    function mysql_real_escape_string($s){
        global $dbconnect;
        return mysqli_real_escape_string($dbconnect,$s);
    }
    function mysql_data_seek($re,$row){
        return mysqli_data_seek($re,$row);
    }
    function mysql_result($res,$row=0,$col=0){
        $numrows = mysqli_num_rows($res);
        if ($numrows && $row <= ($numrows-1) && $row >=0){
            mysqli_data_seek($res,$row);
            $resrow = (is_numeric($col)) ? mysqli_fetch_row($res) : mysqli_fetch_assoc($res);
            if (isset($resrow[$col])){
                return $resrow[$col];
            }
        }
        return false;
    }
    function mysql_get_server_info() {
        global $dbconnect;
        return mysqli_get_server_info($dbconnect);
    }
    function mysql_set_charset($csname) {
        global $dbconnect;
        return mysqli_set_charset($dbconnect,$csname);
    }
    function mysql_fetch_object($result) {
        return mysqli_fetch_object($result);
    }
}

// Init
$config = new Config("/etc/awfy-server.config");
