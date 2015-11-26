<?php

// Update control tables

$migrate = function() {
    mysql_query("ALTER TABLE `control_task_queue` ADD `available_at` INT (10) UNSIGNED NOT NULL;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_tasks` ADD `last_scheduled` INT (10) UNSIGNED NOT NULL;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_tasks` ADD `delay` INT (10) UNSIGNED NOT NULL;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `control_task_queue` DROP `available_at`;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_tasks` DROP `last_scheduled`;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_tasks` DROP `delay`;") or die(mysql_error());
};
