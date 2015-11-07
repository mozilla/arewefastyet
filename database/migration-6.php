<?php

// Update control tables

$migrate = function() {
    mysql_query("ALTER TABLE `control_task_queue` DROP `busy`;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_task_queue` ADD `finish` INT (10) UNSIGNED NOT NULL;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_task_queue` ADD `error` TEXT NOT NULL;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `control_task_queue` DROP `finish`;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_task_queue` DROP `error`;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_task_queue` ADD `busy` tinyint (1) NOT NULL;") or die(mysql_error());
	mysql_query("TRUNCATE TABLE control_task_queue");
};
