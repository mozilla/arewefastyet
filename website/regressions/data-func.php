<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function prev_($stamp, $machine, $mode, $suite, $limit = 1) {
    $query = mysql_query("SELECT awfy_score.id, score, cset
					      FROM awfy_score
					      INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
					      INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
					      WHERE stamp < ".(int)$stamp." AND
					       	 machine = ".(int)$machine." AND
					       	 mode_id = ".(int)$mode." AND
					       	 suite_version_id = ".(int)$suite." AND
					       	 status = 1
					      ORDER BY stamp DESC
					      LIMIT ".(int)$limit) or die(mysql_error());
	$output = array();
	while ($prevs = mysql_fetch_assoc($query)) {
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

function get($db, $id, $field) {
	$query = mysql_query("SELECT $field FROM awfy_$db
						  WHERE id = $id
						  LIMIT 1");
	$output = mysql_fetch_assoc($query) or die(mysql_error());
	return $output[$field];
}

