<?php

require_once(__DIR__."/../internals.php");
require_once("DB.php");
require_once("Build.php");

class Breakdown extends DB {

    public static $db = "awfy_breakdown";

    public function __construct($id) {
        $this->id = $id;
    }

    public function suite_test_id() {
        return $this->select("suite_test_id");
    }

    public function score_id() {
        return $this->select("score_id");
    }

    public function score() {
        return Score::FromId($this->score_id());
    }

    public function points() {
        return $this->select("score");
    }

    public function prev() {
        $score = $this->score();
        $build = $score->build();
        $run = $build->run();

        $qPrev = awfy_query("SELECT awfy_breakdown.id
                             FROM awfy_breakdown
                             INNER JOIN awfy_score ON awfy_score.id = awfy_breakdown.score_id
                             INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
                             INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
                             WHERE awfy_run.sort_order < ".$run->sort_order()." AND
                                   awfy_run.machine = ".$run->machine_id()." AND
                                   awfy_run.status = 1 AND
                                   awfy_build.mode_id = ".$build->mode_id()." AND
                                   awfy_score.suite_version_id = ".$score->suite_version_id()." AND
                                   awfy_breakdown.suite_test_id = ".$this->suite_test_id()."
                             ORDER BY sort_order DESC
                             LIMIT 1");
        if (mysql_num_rows($qPrev) == 0)
            return null;
        $prev = mysql_fetch_object($qPrev);
        return new Breakdown($prev->id);
    }

    public function next() {
        $score = $this->score();
        $build = $score->build();
        $run = $build->run();

        $qNext = awfy_query("SELECT awfy_breakdown.id
                             FROM awfy_breakdown
                             INNER JOIN awfy_score ON awfy_score.id = awfy_breakdown.score_id
                             INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
                             INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
                             WHERE awfy_run.sort_order > ".$run->sort_order()." AND
                                   awfy_run.machine = ".$run->machine_id()." AND
                                   awfy_run.status = 1 AND
                                   awfy_build.mode_id = ".$build->mode_id()." AND
                                   awfy_score.suite_version_id = ".$score->suite_version_id()." AND
                                   awfy_breakdown.suite_test_id = ".$this->suite_test_id()."
                             ORDER BY sort_order ASC
                             LIMIT 1");
        if (mysql_num_rows($qNext) == 0)
            return null;
        $next = mysql_fetch_object($qNext);
        return new Breakdown($next->id);
    }
}
