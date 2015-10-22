<?php
// Add entries for Servo in the awfy_vendor and awfy_mode.
function migrate() {
    // INSERT an entry into awfy_vendor
    mysql_query("INSERT INTO `awfy_vendor` (`name`, `vendor`, `csetURL`, `browser`, `rangeURL`) VALUES ('SpiderMonkey', 
                'Mozilla', 'https://github.com/servo/servo/commits/', 'Servo',
                'https://github.com/servo/servo/compare/{from}...{to}');"
    ) or die(mysql_error());

    // Get last inserted id
    $vendor_id = mysql_insert_id();

    // INSERT into awfy_mode with inserted vendor id
    mysql_query("INSERT INTO `awfy_mode` (`vendor_id`, `mode`, `name`, `color`, `level`) VALUES ({$vendor_id}, 'servo', 
                'Servo', '#FF0000', 1);"
    ) or die(mysql_error());
}

function rollback() {
    // Delete mode first
    mysql_query("DELETE FROM `awfy_mode` WHERE `awfy_mode`.`mode`='servo' AND `awfy_mode`.`name`='Servo' AND 
                `awfy_mode`.`color`='#FF0000' AND `awfy_mode`.`level`=1;"
    ) or die(mysql_error());

    // Delete vendor now
    mysql_query("DELETE FROM `awfy_vendor` WHERE `awfy_vendor`.`name`='SpiderMonkey' AND 
                `awfy_vendor`.`vendor`='Mozilla' AND `awfy_vendor`.`csetURL`='https://github.com/servo/servo/commits/'
                AND `awfy_vendor`.`browser`='Servo'; "
    ) or die(mysql_error());
}