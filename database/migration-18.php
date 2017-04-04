<?php

$name = "emberperf"; // Corresponds to the name in benchmarks_shell.py. An unique name without spaces.
$pretty_name = "Ember perf"; // The name that will be visible on the AWFY site.
$lower_is_better = true; // If the benchmark is measuring time executing. Lower is better. If the benchmark is a score this needs to be false.

$migrate = function() {
    mysql_query("INSERT INTO `awfy_suite` (`name`, `description`, `better_direction`, `visible`) VALUES ('$name', '$pretty_name', '"+(($lower_is_better)?"-1":"1")+"', '1');
};

$rollback = function() {
    mysql_query("DELETE FROM `awfy_suite` WHERE `name` = '$name'");
};
