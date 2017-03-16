<?php

$migrate = function() {
	mysql_query("ALTER TABLE `control_tasks` ADD `monitor_timeout` INT UNSIGNED NOT NULL AFTER `delay`, ADD `monitor_last_checked` INT UNSIGNED NOT NULL AFTER `monitor_timeout`, ADD `monitor_contact` TEXT NOT NULL AFTER `monitor_last_checked`;");
    mysql_query("ALTER TABLE `machine` DROP `last_checked`");
    mysql_query("ALTER TABLE `machine` DROP `timeout`");
    mysql_query("ALTER TABLE `machine` DROP `contact`");
};

$rollback = function() {
    mysql_query("ALTER TABLE `control_task_queue` DROP `monitor_timeout`");
    mysql_query("ALTER TABLE `control_task_queue` DROP `monitor_contact`");
    mysql_query("ALTER TABLE `control_task_queue` DROP `monitor_last_checked`");
	mysql_query("ALTER TABLE `machine` ADD `timeout` INT UNSIGNED NOT NULL AFTER `message`, ADD `last_checked` INT UNSIGNED NOT NULL AFTER `timeout`, ADD `contact` TEXT NOT NULL AFTER `last_checked`;");
};
