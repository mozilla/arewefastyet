<?php

// Add field 'outoforder' to the awfy_run database. In that case the finish_date shouldn't be used
// to know where on the graph to show this datapoint. 

$migrate = function() {
    mysql_query("ALTER TABLE `awfy_run` ADD `out_of_order` BOOLEAN NOT NULL;") or die(mysql_error());
};

$rollback = function() {
    mysql_query("ALTER TABLE `awfy_run` DROP `out_of_order`;") or die(mysql_error());
};
