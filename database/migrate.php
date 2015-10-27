<?php

set_error_handler(function($errno, $errstr) {
    echo $errstr."\n";
    die("Did you set /etc/awfy-server.config ?\n");
});
include "../website/internals.php";
restore_error_handler();

mysql_connect($config->mysql_host, $config->mysql_username, $config->mysql_password) or die("ERROR: " . mysql_error());
if (!mysql_select_db($config->mysql_db_name)) {
    /* Create db */
    mysql_query("CREATE DATABASE ".$config->mysql_db_name) or die("ERROR: " . mysql_error());
    echo "Database created\n";
}
mysql_select_db($config->mysql_db_name) or die("ERROR: " . mysql_error());

if (mysql_num_rows(mysql_query("SHOW TABLES LIKE 'awfy_config'")) != 1)  {
    /* Load initial db */
    echo "Load initial database. (Upon fail, just import schema.sql in your database).\n";
    $command = "mysql -u{$config->mysql_username} -p{$config->mysql_password} "
     . "-h {$config->mysql_host} -D {$config->mysql_db_name} < schema.sql";

    $output = shell_exec($command);
    echo "Finished loading initial database.\n";
}

$query = mysql_query("SELECT value as version FROM awfy_config WHERE awfy_config.key = 'migration'") or die("ERROR: " . mysql_error());
if (mysql_num_rows($query) == 1) {
    $migration = mysql_fetch_object($query);
    $version = $migration->version;
} else {
    $version = 0;
    mysql_query("INSERT INTO awfy_config (`key`,value) VALUES ('migration', '$version')");
}

function run($version) {
    include "migration-".$version.".php";
    $migrate();
}
while (true) {
    if (!file_exists("migration-".++$version.".php"))
        break;

    echo "Running migration migration-".$version.".php\n";
    run($version);
    mysql_query("UPDATE awfy_config SET value = '$version' WHERE awfy_config.key = 'migration'");
}

echo "Currently at migration: ".($version - 1)."\n";
