<?php

include "../website/internals.php";

init_database();

$query = mysql_query("SELECT value as version FROM awfy_config WHERE awfy_config.key = 'migration'") or die("ERROR: " . mysql_error());
$migration = mysql_fetch_object($query);

$version = $migration->version;
echo "Rolling back migration migration-".$version.".php\n";
include "migration-".$version.".php";
rollback();
mysql_query("UPDATE awfy_config SET value = '".($version-1)."' WHERE awfy_config.key = 'migration'");

echo "Currently at migration: ".($version - 1)."\n";
