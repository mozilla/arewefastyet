<?php
$migrate = function() {
	mysql_query("ALTER TABLE `awfy_suite_test` ADD `better_direction` TINYINT NOT NULL DEFAULT '0' AFTER `visible`; ");
};
$rollback = function() {
};

