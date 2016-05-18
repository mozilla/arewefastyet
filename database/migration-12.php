<?php

$migrate = function() {
    mysql_query("ALTER TABLE `control_task_queue` ADD `control_tasks_id` INT( 10 ) UNSIGNED NOT NULL ;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `control_task_queue` DROP `control_tasks_id`;") or die(mysql_error());
};
