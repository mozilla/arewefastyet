<?php

require_once(__DIR__."/../internals.php");
require_once("DB.php");
require_once("Run.php");
require_once("Score.php");

class Build extends DB {

    public static $db = "awfy_build";

    public function __construct($id) {
        $this->id = $id;
    }

    public static function withRunAndMode($run_id, $mode_id) {
        $qBuild = awfy_query("SELECT id FROM awfy_build
                              WHERE run_id = $run_id AND
                                    mode_id = $mode_id
                              LIMIT 1");
        if (mysql_num_rows($qBuild) == 0)
            return null;
        $build = mysql_fetch_object($qBuild);
        return new Build($build->id);
    }

    public static function insert($run, $mode_id, $revision) {
        if ($run->isFinished())
            throw new Exception("Cannot info to a run that is finished.");

        $maybeBuild = Build::withRunAndMode($run->id, $mode_id);
        if ($maybeBuild != null) {
            return $maybeBuild;
        }

        awfy_query("INSERT INTO awfy_build
                    (run_id, mode_id, cset)
                    VALUES
                    ({$run->id}, $mode_id, '".mysql_real_escape_string($revision)."')");

        return new Build(mysql_insert_id());
    }

    public function scores() {
        $qScore = awfy_query("SELECT id FROM awfy_score
                              WHERE build_id = {$this->id}");
		$scores = Array();
		while ($score = mysql_fetch_object($qScore)) {
			$scores[] = new Score($score->id);
		}
		return $scores;
    }

    public function revision() {
        return $this->select("cset");
    }

    public function run_id() {
        return $this->select("run_id");
    }

    public function run() {
        return new Run($this->run_id());
    }

    public function mode_id() {
        return $this->select("mode_id");
    }
}
