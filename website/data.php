<?php

$datafolder = "/home/h4writer/data/";

function fault() {
	exit();
}

if (!isset($_GET["file"]))
	fault();

$file = $_GET["file"];
if (substr($file, 0, 4) == "auth")
	fault();
if (!preg_match("/^[a-zA-Z0-9-.]*$/i", $file))
	fault();

$file = $datafolder.$file;
if (!file_exists($file)) {
	if (!has_permissions())
		fault();

	$file = $datafolder."auth-".$file;
	if (!file_exists($file))
		fault();
}

if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) &&
    strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) == filemtime($file))
{
    header('Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($file)).' GMT', true, 304);
} else {
    header('Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($file)).' GMT', true, 200);
    header('Content-Length: '.filesize($file));
	echo file_get_contents($file); 
}
