<?php

// Demote 'stamp' to a number that will be sequential to base off the sorting.

$migrate = function() {
    mysql_query("ALTER TABLE `awfy_run` CHANGE `stamp` `sort_order` INT( 10 ) UNSIGNED NOT NULL ;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `awfy_run` CHANGE `sort_order` `stamp` INT( 10 ) UNSIGNED NOT NULL ;") or die(mysql_error());
};
