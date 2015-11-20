<?php

// Update control tables

$migrate = function() {
    mysql_query("ALTER TABLE `awfy_regression` CHANGE `status` `status` ENUM( 'unconfirmed', 'confirmed', 'improvement', 'fixed', 'wontfix', 'infrastructure', 'noise', 'triage', 'obsolete' ) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `awfy_regression` CHANGE `status` `status` ENUM( 'unconfirmed', 'confirmed', 'improvement', 'fixed', 'wontfix', 'infrastructure', 'noise', 'triage' ) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL") or die(mysql_error());
};
