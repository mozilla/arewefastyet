<?php


$migrate = function() {
	mysql_query("ALTER TABLE `control_task_queue` CHANGE `start` `start` INT(10) UNSIGNED NOT NULL DEFAULT '0'"); 
	mysql_query("ALTER TABLE `control_task_queue` CHANGE `finish` `finish` INT(10) UNSIGNED NOT NULL DEFAULT '0'"); 
};

$rollback = function() {
};
