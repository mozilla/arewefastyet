<?php

// Update control tables

$migrate = function() {
    mysql_query("RENAME TABLE `awfy`.`control_machine` TO `awfy`.`control_unit`;") or die(mysql_error());
    mysql_query("RENAME TABLE `awfy`.`control_tasks` TO `awfy`.`control_task_queue`;") or die(mysql_error());

    mysql_query("CREATE TABLE IF NOT EXISTS `control_tasks` (
                 `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
                 `control_unit_id` int(10) unsigned NOT NULL,
                 `machine_id` int(10) unsigned NOT NULL,
                 `mode_id` int(10) unsigned NOT NULL,
                 `task` text NOT NULL,
                 PRIMARY KEY (`id`),
                 KEY `control_unit_id` (`control_unit_id`,`machine_id`,`mode_id`)
                     ) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;") or die(mysql_error());

    mysql_query("ALTER TABLE `control_unit` DROP `empty_task`;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_task_queue` CHANGE `control_machine_id` `control_unit_id` INT( 10 ) UNSIGNED NOT NULL ;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("DROP TABLE control_tasks") or die(mysql_error());
    mysql_query("RENAME TABLE `awfy`.`control_task_queue` TO `awfy`.`control_tasks`;") or die(mysql_error());
    mysql_query("RENAME TABLE `awfy`.`control_unit` TO `awfy`.`control_machine`;") or die(mysql_error());

    mysql_query("ALTER TABLE `control_machine` ADD `empty_task` TEXT NOT NULL ;") or die(mysql_error());
    mysql_query("ALTER TABLE `control_tasks` CHANGE `control_unit_id` `control_machine_id` INT( 10 ) UNSIGNED NOT NULL ;") or die(mysql_error());
};
