<?php

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("DB/Run.php");
require_once("DB/Build.php");

class RegressionTools {

	static function inbetweenBuilds($regression) {
		$build = $regression->build();
		$run = $build->run();

		$mode_id = $build->mode_id();
		$machine_id = $run->machine_id();
		$sortOrder = $run->sort_order();
		$prevSortOrder = $regression->prev_build()->run()->sort_order();

		$builds = Array();
		for($i = $prevSortOrder + 1; $i < $sortOrder; $i++) {
			$run_i = Run::withMachineAndSortOrder($machine_id, $i);
			if (!$run_i->isFinished())
				continue;
			$build = Build::withRunAndMode($run_i->id, $mode_id);
			if (!$build)
				continue;
			if (count($build->scores()) == 0)
				continue;
			$builds[] = $build;
		}
		return $builds;
	}

}
