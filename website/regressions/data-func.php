<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function prev_($stamp, $machine, $mode, $suite, $limit = 1) {
	$limit = (int) $limit;
    $query = "SELECT awfy_score.id, score, cset
			  FROM awfy_score
			  INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
			  INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
			  WHERE stamp < $1 AND
			     stamp >= $2 AND
			   	 machine = ".(int)$machine." AND
			   	 mode_id = ".(int)$mode." AND
			   	 suite_version_id = ".(int)$suite." AND
			   	 status = 1
			  ORDER BY stamp DESC
			  LIMIT $3";
	$output = array();

	$stamp_n = $stamp - 60 * 60; 
	$query_n = str_replace("$1", $stamp , $query);
	$query_n = str_replace("$2", $stamp_n , $query_n);
	$query_n = str_replace("$3", $limit , $query_n);
	$q = mysql_query($query_n) or die(mysql_error());
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	if (count($output) == $limit)
		return $output;

	$stamp = $stamp_n; 
	$stamp_n = $stamp - 60 * 60 * 24; 
	$query_n = str_replace("$1", $stamp , $query);
	$query_n = str_replace("$2", $stamp_n , $query_n);
	$query_n = str_replace("$3", $limit - count($output) , $query_n);
	$q = mysql_query($query_n) or die(mysql_error());
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	if (count($output) == $limit)
		return $output;

	$stamp = $stamp_n; 
	$stamp_n = 0; 
	$query_n = str_replace("$1", $stamp , $query);
	$query_n = str_replace("$2", $stamp_n , $query_n);
	$query_n = str_replace("$3", $limit - count($output) , $query_n);
	$q = mysql_query($query_n) or die(mysql_error());
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	return $output;
}

function prev_suite_test($stamp, $machine, $mode, $suite_test, $limit = 1) {
	$limit = (int) $limit;
    $query = "SELECT awfy_breakdown.id, score, cset
              FROM awfy_breakdown
              INNER JOIN awfy_build ON awfy_build.id = awfy_breakdown.build_id
              INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
              WHERE stamp < $1 AND
                    stamp >= $2 AND
                    machine = ".(int)$machine." AND
                    mode_id = ".(int)$mode." AND
                    suite_test_id = ".(int)$suite_test." AND
                    status = 1
              ORDER BY stamp DESC
              LIMIT $3";
	$output = array();

	$stamp_n = $stamp - 60 * 60; 
	$query_n = str_replace("$1", $stamp , $query);
	$query_n = str_replace("$2", $stamp_n , $query_n);
	$query_n = str_replace("$3", $limit , $query_n);
	$q = mysql_query($query_n) or die(mysql_error());
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	if (count($output) == $limit)
		return $output;

	$stamp = $stamp_n; 
	$stamp_n = $stamp - 60 * 60 * 24; 
	$query_n = str_replace("$1", $stamp , $query);
	$query_n = str_replace("$2", $stamp_n , $query_n);
	$query_n = str_replace("$3", $limit - count($output) , $query_n);
	$q = mysql_query($query_n) or die(mysql_error());
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	if (count($output) == $limit)
		return $output;

	$stamp = $stamp_n; 
	$stamp_n = 0; 
	$query_n = str_replace("$1", $stamp , $query);
	$query_n = str_replace("$2", $stamp_n , $query_n);
	$query_n = str_replace("$3", $limit - count($output) , $query_n);
	$q = mysql_query($query_n) or die(mysql_error());
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	return $output;
}

function next_($stamp, $machine, $mode, $suite, $limit = 1) {
    $query = mysql_query("SELECT awfy_score.id, score, cset
					      FROM awfy_score
					      INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
					      INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
					      WHERE stamp > ".(int)$stamp." AND
					       	 machine = ".(int)$machine." AND
					       	 mode_id = ".(int)$mode." AND
					       	 suite_version_id = ".(int)$suite." AND
					       	 status = 1
					      ORDER BY stamp ASC
					      LIMIT ".(int)$limit) or die(mysql_error());
	$output = array();
	while ($nexts = mysql_fetch_assoc($query)) {
		$output[] = $nexts;
	}
	return $output;
}

function next_suite_test($stamp, $machine, $mode, $suite_test, $limit = 1) {
    $query = mysql_query("SELECT awfy_breakdown.id, score, cset
					      FROM awfy_breakdown
					      INNER JOIN awfy_build ON awfy_build.id = awfy_breakdown.build_id
					      INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
					      WHERE stamp > ".(int)$stamp." AND
					       	 machine = ".(int)$machine." AND
					       	 mode_id = ".(int)$mode." AND
					       	 suite_test_id = ".(int)$suite_test." AND
					       	 status = 1
					      ORDER BY stamp ASC
					      LIMIT ".(int)$limit) or die(mysql_error());
	$output = array();
	while ($nexts = mysql_fetch_assoc($query)) {
		$output[] = $nexts;
	}
	return $output;
}

function get($db, $id, $field) {
	$query = mysql_query("SELECT $field FROM awfy_$db
						  WHERE id = $id
						  LIMIT 1");
	$output = mysql_fetch_assoc($query) or die(mysql_error());
	return $output[$field];
}

