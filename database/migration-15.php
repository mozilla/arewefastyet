<?php


$migrate = function() {
    mysql_query("DROP TABLE awfy_regression_breakdown_noise");
    mysql_query("DROP TABLE awfy_regression_score_noise");
	mysql_query("ALTER TABLE `awfy_suite` DROP `confidence_factor`;");
	mysql_query("ALTER TABLE `awfy_suite_test` DROP `confidence_factor`;");
    mysql_query("ALTER TABLE `awfy_machine` DROP `confidence_runs`");
};

$rollback = function() {

    mysql_query("CREATE TABLE `awfy_regression_breakdown_noise` (
                 `id` int(10) UNSIGNED NOT NULL,
                 `machine_id` int(10) UNSIGNED NOT NULL,
                 `mode_id` int(10) UNSIGNED NOT NULL,
                 `suite_test_id` int(10) UNSIGNED NOT NULL,
                 `noise` double NOT NULL,
                 `disabled` tinyint(1) NOT NULL DEFAULT '0'
                 ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='avg_consequent_diff'");

    mysql_query("ALTER TABLE `awfy_regression_breakdown_noise`
                 ADD PRIMARY KEY (`id`),
                 ADD UNIQUE KEY `machine_id` (`machine_id`,`mode_id`,`suite_test_id`)");

    mysql_query("ALTER TABLE `awfy_regression_breakdown_noise`
                 MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT");

	mysql_query("CREATE TABLE `awfy_regression_score_noise` (
	               `id` int(10) UNSIGNED NOT NULL,
	               `machine_id` int(10) UNSIGNED NOT NULL,
	               `mode_id` int(10) UNSIGNED NOT NULL,
	               `suite_version_id` int(10) UNSIGNED NOT NULL,
	               `noise` double NOT NULL,
	               `disabled` tinyint(1) NOT NULL DEFAULT '0'
	             ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='avg_consequent_diff'");

	mysql_query("ALTER TABLE `awfy_regression_score_noise`
	             ADD PRIMARY KEY (`id`),
	             ADD KEY `machine_id` (`machine_id`),
	             ADD KEY `mode_id` (`mode_id`),
	             ADD KEY `suite_version_id` (`suite_version_id`)");

	mysql_query("ALTER TABLE `awfy_regression_score_noise`
  				 MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT");

    mysql_query("ALTER TABLE `awfy_suite` ADD `confidence_factor` FLOAT NOT NULL DEFAULT '1' AFTER `visible`");
    mysql_query("ALTER TABLE `awfy_suite_test` ADD `confidence_factor` FLOAT NOT NULL DEFAULT '1' AFTER `visible`");
    mysql_query("ALTER TABLE `awfy_machine` ADD `confidence_runs` TINYINT NOT NULL DEFAULT '5' AFTER `message`");
};
