<?php

// Demote 'stamp' to a number that will be sequential to base off the sorting.

$migrate = function() {
    mysql_query("ALTER TABLE `awfy_run` ADD `sort_order` INT ( 10 ) UNSIGNED NOT NULL;") or die(mysql_error());

    $query = mysql_query("SELECT distinct(machine) as machine FROM awfy_run") or die(mysql_error());
    while($run = mysql_fetch_object($query)) {
        mysql_query("SET @pos := 0;")or die (mysql_error());
        mysql_query("UPDATE awfy_run
                     SET sort_order = ( SELECT @pos := @pos + 1 )
                     WHERE machine = ".$run->machine." ORDER BY stamp ASC;") or die(mysql_error());
    }
};

$rollback = function() {
    mysql_query("ALTER TABLE `awfy_run` DROP `sort_order`;") or die(mysql_error());
};
