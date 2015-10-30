<?php

require_once("DB/Run.php");
require_once("DB/Mode.php");
require_once("DB/Build.php");

class RunReporter {

    public static function createForMachine($machine_id) {
        $query = mysql_query("SELECT max(sort_order) as maximum
                              FROM awfy_run
                              WHERE machine = $machine_id") or die(mysql_error());
        $run = mysql_fetch_object($query);

        return Run::insert($machine_id, $run->maximum);
    }

    public static function createOutOfOrder($machine_id, $mode_id, $revision,
                                            $run_before_id, $run_after_id)
    { 
        $run_before = new Run($run_before_id); 
        $run_after = new Run($run_after_id); 

        // Find the sorting order where we could add this revision;
        $sort_order = RunReporter::findSortOrder($run_before, $mode_id, $revision);

        // sanity check.
        if ($sort_order >= run_after->sort_order())
            throw new Exception("Given run bounds were incorrect.");

        // Create a space at the given sort_order, by shifting all sort_order,
        // equal or higher than the given sort_order.
        RunReporter::increaseNextSortOrder($machine_id, $sort_order);

        $run = Run::insert($machine_id, $sort_order, $run_before->approx_stamp());
        $build = Build::insert($run, $mode_id, $revision);
        return $run;
    }

    private static function findSortOrder($run, $mode_id, $revision)
    {
        $version_control = VersionControl::forMode($mode_id);

        while (True) {
            if (!$run->isBuildInfoComplete())
                throw new Exception("Encountered an incomplete run.");
                
            $build = Build::withRunAndMode($run_before->id, $mode_id);

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
            if ($version_control->isAfter($build->revision(), $revision))
                return $run->sort_order();

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
