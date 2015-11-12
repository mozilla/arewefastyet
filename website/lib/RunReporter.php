<?php

require_once("DB/Run.php");
require_once("DB/Mode.php");
require_once("DB/Build.php");
require_once("VersionControl.php");

class RunReporter {

    public static function createForMachine($machine_id) {
        $query = mysql_query("SELECT max(sort_order) as maximum
                              FROM awfy_run
                              WHERE machine = $machine_id") or die(mysql_error());
        $run = mysql_fetch_object($query);

        return Run::insert($machine_id, $run->maximum+1);
    }

    public static function createOutOfOrder($machine_id, $mode_id, $revision,
                                            $run_before_id, $run_after_id)
    { 
        $run_before = new Run($run_before_id); 
        $run_after = new Run($run_after_id); 

        // Find the sorting order where we could add this revision;
        $sort_order = RunReporter::findSortOrder($run_before, $mode_id, $revision);

        // Get the approx stamp of the run with the sort_order before the one we are replacing.
        $old_run = Run::withMachineAndSortOrder($machine_id, $sort_order - 1);
        $approx_stamp = $old_run->approx_stamp(); 

        // sanity check.
        RunReporter::assertInBound($run_before, $run_after, $mode_id, $sort_order);

        // Create a space at the given sort_order, by shifting all sort_order,
        // equal or higher than the given sort_order.
        RunReporter::increaseNextSortOrder($machine_id, $sort_order);

        $run = Run::insert($machine_id, $sort_order, $approx_stamp);
        $run->updateInt("out_of_order", 1);
        $build = Build::insert($run, $mode_id, $revision);
        return $run;
    }

    private static function assertInBound($run_before, $run_after, $mode_id, $sort_order) {
        if ($sort_order <= $run_before->sort_order())
            throw new Exception("bound is lower.");
        if ($sort_order > $run_after->sort_order()) {
            // It is allowed to have a not in bound $sort_order,
            // when the revision stays the same between $run_after and the $sort_order.
            $current_run = Run::withMachineAndSortOrder($run_after->machine_id(), $sort_order)->prev();
            $current_build = Build::withRunAndMode($current_run->id, $mode_id);
            $after_build = Build::withRunAndMode($run_after->id, $mode_id);
            if ($current_build->revision() != $after_build->revision())
                throw new Exception("bound is higher.");
        }
    }

    private static function findSortOrder($run, $mode_id, $revision)
    {
        $version_control = VersionControl::forMode($mode_id);

        $j = 0;
        while (True) {
            if ($j++ > 30)
                throw new Exception("There shouldn't be too many runs in between");

            if (!$run->isBuildInfoComplete())
                throw new Exception("Encountered an incomplete run.");
                
            $build = Build::withRunAndMode($run->id, $mode_id);

            // We can safely ignore runs that have no results with the requested mode_id
            if (!$build) {
                $run = $run->next();
                continue;
            }

            // We skip to the next run, if revisions are the same.
            // To make sure that new runs are shown after existing ones.
            if ($version_control->equal($build->revision(), $revision)) {
                $run = $run->next();
                continue;
            }

            // Using version control take a peek if the revision
            // is later/earlier than this one.
            if ($version_control->isAfter($build->revision(), $revision)) {
                return $run->sort_order();
            }

            $run = $run->next();
        }
    }

    private static function increaseNextSortOrder($machine_id, $sort_order) {
        mysql_query("UPDATE awfy_run
                     SET sort_order = sort_order + 1
                     WHERE machine = $machine_id AND
                     sort_order >= $sort_order") or die(mysql_error());
    }
}
