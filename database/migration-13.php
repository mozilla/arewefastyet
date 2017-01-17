<?php


$migrate = function() {
    mysql_query("ALTER TABLE `control_task_queue` ADD `output` LONGTEXT NOT NULL AFTER `finish`;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `control_task_queue` DROP `output`;") or die(mysql_error());
};
