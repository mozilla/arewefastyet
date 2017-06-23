<?php

require_once(__DIR__."/../internals.php");
require_once("DB.php");
require_once("Build.php");

class Score extends DB {

    public static $db = "awfy_score";

    public function __construct($id) {
        $this->id = $id;
    }

    public static function withBuildAndSuiteVersion($build_id, $suite_version_id) {
        $qScore = awfy_query("SELECT id FROM awfy_score
                              WHERE build_id = $build_id AND
                                    suite_version_id = $suite_version_id
                              LIMIT 1");
        if (mysql_num_rows($qScore) == 0)
            return null;
        $score = mysql_fetch_object($qScore);
        return new Score($score->id);

    }

    public function build_id() {
        return $this->select("build_id");
    }

    public function build() {
        return new Build($this->build_id());
    }

    public function suite_version_id() {
        return $this->select("suite_version_id");
    }

    public function points() {
        return $this->select("score");
    }

    public function prev() {
        $build = $this->build();
        $run = $build->run();

        $qPrev = awfy_query("SELECT awfy_score.id
                             FROM awfy_score
                             INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
                             INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
                             WHERE awfy_run.sort_order < ".$run->sort_order()." AND
                                   awfy_run.machine = ".$run->machine_id()." AND
                                   awfy_run.status = 1 AND
                                   awfy_build.mode_id = ".$build->mode_id()." AND
                                   awfy_score.suite_version_id = ".$this->suite_version_id()."
                             ORDER BY sort_order DESC
                             LIMIT 1");
        if (mysql_num_rows($qPrev) == 0)
            return null;
        $prev = mysql_fetch_object($qPrev);
        return new Score($prev->id);
    }

    public function next() {
        $build = $this->build();
        $run = $build->run();

        $qNext = awfy_query("SELECT awfy_score.id
                             FROM awfy_score
                             INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id
                             INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id
                             WHERE awfy_run.sort_order > ".$run->sort_order()." AND
                                   awfy_run.machine = ".$run->machine_id()." AND
                                   awfy_run.status = 1 AND
                                   awfy_build.mode_id = ".$build->mode_id()." AND
                                   awfy_score.suite_version_id = ".$this->suite_version_id()."
                             ORDER BY sort_order ASC
                             LIMIT 1");
        if (mysql_num_rows($qNext) == 0)
            return null;
        $next = mysql_fetch_object($qNext);
        return new Score($next->id);
    }
}
