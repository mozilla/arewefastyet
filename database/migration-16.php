<?php

$migrate = function() {
    mysql_query("ALTER TABLE `control_task_queue` ADD `email` VARCHAR(255) NOT NULL AFTER `control_tasks_id`;");
};

$rollback = function() {
    mysql_query("ALTER TABLE `control_task_queue` DROP `email`");
};
