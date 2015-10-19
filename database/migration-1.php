<?php

// Demote 'stamp' to a number that will be sequential to base off the sorting.

function migrate() {
    mysql_query("ALTER TABLE `awfy_run` CHANGE `stamp` `sort_order` INT( 10 ) UNSIGNED NOT NULL ;") or die(mysql_error());
}

function rollback() {
    mysql_query("ALTER TABLE `awfy_run` CHANGE `sort_order` `stamp` INT( 10 ) UNSIGNED NOT NULL ;") or die(mysql_error());
}
