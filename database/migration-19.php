<?php
$migrate = function() {
	mysql_query("ALTER TABLE `awfy_machine` DROP `timeout`, DROP `contact`;`");
};
$rollback = function() {
};
