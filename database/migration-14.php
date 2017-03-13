<?php


$migrate = function() {
	mysql_query("ALTER TABLE `control_task_queue` CHANGE `start` `start` INT(10) UNSIGNED NOT NULL DEFAULT '0'"); 
	mysql_query("ALTER TABLE `control_task_queue` CHANGE `finish` `finish` INT(10) UNSIGNED NOT NULL DEFAULT '0'"); 
	mysql_query("ALTER TABLE `control_task_queue` CHANGE `output` `output` LONGTEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL") or die(mysql_error()); 
	mysql_query("ALTER TABLE `control_task_queue` CHANGE `error` `error` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL;");
};

$rollback = function() {
};
