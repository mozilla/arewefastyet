<?php
// vim: set ts=4 sw=4 tw=99 et:

require_once("smarty/libs/Smarty.class.php");

function init_database()
{
    mysql_connect("localhost", "***", "***") or die("ERROR: " . mysql_error());
    mysql_select_db("dvander") or die("ERROR: " . mysql_error());
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

function new_smarty()
{
    $smarty = new Smarty;
    $base = '/usr/apache/htdocs';
    $smarty->template_dir = $base . '/templates';
    $smarty->compile_dir = $base . '/cache_templates';
    $smarty->cache_dir = $base . '/cache_stuff';
    return $smarty;
}

function find_vendor_of_mode_id($mode_id)
{
    $query = "SELECT vendor_id FROM awfy_mode
              WHERE id = $mode_id";
    $results = mysql_query($query);
    if (!$results || mysql_num_rows($results) < 1)
        return 01;
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

function awfy_query($query)
{
    $result = mysql_query($query) or die(mysql_error());
    return $result;
}

?>
