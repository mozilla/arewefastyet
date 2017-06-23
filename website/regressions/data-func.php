<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("../lib/internals.php");
check_permissions();

function prev_($sort_order_id, $machine, $mode, $suite, $limit = 1) {
	$limit = (int) $limit;
    $query = "SELECT awfy_score.id, score, cset
			  FROM awfy_score
			  INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
			  INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
			  WHERE sort_order < $1 AND
			     sort_order >= $2 AND
			   	 machine = ".(int)$machine." AND
			   	 mode_id = ".(int)$mode." AND
			   	 suite_version_id = ".(int)$suite." AND
			   	 status = 1
			  ORDER BY sort_order DESC
			  LIMIT $3";
	$output = array();

	$sort_order_n = $sort_order_id - 60 * 60;
	$query_n = str_replace("$1", $sort_order_id, $query);
	$query_n = str_replace("$2", $sort_order_n , $query_n);
	$query_n = str_replace("$3", $limit , $query_n);
	$q = awfy_query($query_n);
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	if (count($output) == $limit)
		return $output;

	$sort_order_id = $sort_order_n;
	$sort_order_n = $sort_order_id - 60 * 60 * 24;
	$query_n = str_replace("$1", $sort_order_id, $query);
	$query_n = str_replace("$2", $sort_order_n , $query_n);
	$query_n = str_replace("$3", $limit - count($output) , $query_n);
	$q = awfy_query($query_n);
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	if (count($output) == $limit)
		return $output;

	$sort_order_id = $sort_order_n;
	$sort_order_n = 0;
	$query_n = str_replace("$1", $sort_order_id, $query);
	$query_n = str_replace("$2", $sort_order_n , $query_n);
	$query_n = str_replace("$3", $limit - count($output) , $query_n);
	$q = awfy_query($query_n);
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	return $output;
}

function prev_suite_test($sort_order_id, $machine, $mode, $suite_test, $limit = 1) {
	$limit = (int) $limit;
    $query = "SELECT awfy_breakdown.id, awfy_breakdown.score, cset
              FROM awfy_breakdown
              INNER JOIN awfy_score ON awfy_score.id = score_id
              INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
              INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
              WHERE sort_order < $1 AND
                    sort_order >= $2 AND
                    machine = ".(int)$machine." AND
                    mode_id = ".(int)$mode." AND
                    suite_test_id = ".(int)$suite_test." AND
                    status = 1
              ORDER BY sort_order DESC
              LIMIT $3";
	$output = array();

	$sort_order_n = $sort_order_id - 60 * 60;
	$query_n = str_replace("$1", $sort_order_id , $query);
	$query_n = str_replace("$2", $sort_order_n , $query_n);
	$query_n = str_replace("$3", $limit , $query_n);
	$q = awfy_query($query_n);
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	if (count($output) == $limit)
		return $output;

	$sort_order_id = $sort_order_n;
	$sort_order_n = $sort_order_id - 60 * 60 * 24;
	$query_n = str_replace("$1", $sort_order_id , $query);
	$query_n = str_replace("$2", $sort_order_n , $query_n);
	$query_n = str_replace("$3", $limit - count($output) , $query_n);
	$q = awfy_query($query_n);
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	if (count($output) == $limit)
		return $output;

	$sort_order_id = $sort_order_n;
	$sort_order_n = 0;
	$query_n = str_replace("$1", $sort_order_id , $query);
	$query_n = str_replace("$2", $sort_order_n , $query_n);
	$query_n = str_replace("$3", $limit - count($output) , $query_n);
	$q = awfy_query($query_n);
	while ($prevs = mysql_fetch_assoc($q)) {
		$output[] = $prevs;
	}

	return $output;
}

function next_($sort_order_id, $machine, $mode, $suite, $limit = 1) {
    $query = awfy_query("SELECT awfy_score.id, score, cset
					     FROM awfy_score
					     INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
					     INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
					     WHERE sort_order > ".(int)$sort_order_id." AND
					      	 machine = ".(int)$machine." AND
					      	 mode_id = ".(int)$mode." AND
					      	 suite_version_id = ".(int)$suite." AND
					      	 status = 1
					     ORDER BY sort_order ASC
					     LIMIT ".(int)$limit);
	$output = array();
	while ($nexts = mysql_fetch_assoc($query)) {
		$output[] = $nexts;
	}
	return $output;
}

function next_suite_test($sort_order_id, $machine, $mode, $suite_test, $limit = 1) {
    $query = awfy_query("SELECT awfy_breakdown.id, awfy_breakdown.score, cset
					     FROM awfy_breakdown
					     INNER JOIN awfy_score ON awfy_score.id = score_id
					     INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
					     INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
					     WHERE sort_order > ".(int)$sort_order_id." AND
					      	 machine = ".(int)$machine." AND
					      	 mode_id = ".(int)$mode." AND
					      	 suite_test_id = ".(int)$suite_test." AND
					      	 status = 1
					     ORDER BY sort_order ASC
					     LIMIT ".(int)$limit);
	$output = array();
	while ($nexts = mysql_fetch_assoc($query)) {
		$output[] = $nexts;
	}
	return $output;
}

function get($db, $id, $field) {
	$query = awfy_query("SELECT $field FROM awfy_$db
						 WHERE id = $id
						 LIMIT 1");
	$output = mysql_fetch_assoc($query) or die(mysql_error());
	return $output[$field];
}

function imm_prev_suite_test($breakdown_id) {
	$query = awfy_query("SELECT mode_id, machine, sort_order, suite_test_id
                         FROM `awfy_breakdown`
                         LEFT JOIN awfy_score ON awfy_score.id = score_id
                         LEFT JOIN awfy_build ON awfy_build.id = awfy_score.build_id
                         LEFT JOIN awfy_run ON awfy_run.id = run_id
                         WHERE awfy_breakdown.id = ".$breakdown_id);
    $data = mysql_fetch_assoc($query);

	$prev = prev_suite_test($data["sort_order"], $data["machine"],
				            $data["mode_id"], $data["suite_test_id"]);

	if (count($prev) == 1)
		return $prev[0]["id"];
	return 0;
}

function imm_prev_($score_id) {
	$query = awfy_query("SELECT mode_id, machine, sort_order, suite_version_id
                         FROM `awfy_score`
                         LEFT JOIN awfy_build ON awfy_build.id = build_id
                         LEFT JOIN awfy_run ON awfy_run.id = run_id
                         WHERE awfy_score.id = ".$score_id);
    $data = mysql_fetch_assoc($query);

	$prev = prev_($data["sort_order"], $data["machine"],
			      $data["mode_id"], $data["suite_version_id"]);
	if (count($prev) == 1)
		return $prev[0]["id"];
	return 0;
}
