<?php


$migrate = function() {
    mysql_query("ALTER TABLE `awfy_suite` DROP `totalmeaningless`;") or die(mysql_error());
    mysql_query("ALTER TABLE `awfy_suite` ADD `th_send` BOOLEAN NOT NULL;") or die(mysql_error());
    mysql_query("ALTER TABLE `awfy_suite` ADD `th_send_total` BOOLEAN NOT NULL;") or die(mysql_error());
    mysql_query("ALTER TABLE `awfy_suite` ADD `th_send_subscores` BOOLEAN NOT NULL;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `awfy_suite` ADD `totalmeaningless` BOOLEAN NOT NULL;") or die(mysql_error());
};
