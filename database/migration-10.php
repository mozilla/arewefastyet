<?php

// Add field 'totalmeaningless' to indicate whenever we shouldn't send the total to 
// treeherder.

$migrate = function() {
    mysql_query("ALTER TABLE `awfy_suite` ADD `totalmeaningless` BOOLEAN NOT NULL;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `awfy_suite` DROP `totalmeaningless`;") or die(mysql_error());
};
