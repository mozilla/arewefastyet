<?php

// Add field 'treeherder' to the awfy_run database.
// And mark all previous runs supposedly submitted to treeherder

$migrate = function() {
    mysql_query("ALTER TABLE `awfy_run` ADD `treeherder` BOOLEAN NOT NULL;") or die(mysql_error());
    mysql_query("UPDATE awfy_run SET `treeherder` = 1 WHERE status != 0;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `awfy_run` DROP `treeherder`;") or die(mysql_error());
};
