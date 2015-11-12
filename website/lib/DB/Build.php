<?php

require_once("DB.php");
require_once("Run.php");

class Build extends DB {

    public static $db = "awfy_build";

    public function __construct($id) {
        $this->id = $id;
    }

    public static function withRunAndMode($run_id, $mode_id) {
        $qBuild = mysql_query("SELECT id FROM awfy_build
                               WHERE run_id = $run_id AND
                                     mode_id = $mode_id
                               LIMIT 1") or die(mysql_error());
        if (mysql_num_rows($qBuild) == 0)
            return null;
        $build = mysql_fetch_object($qBuild);
        return new Build($build->id);
    }

    public static function insert($run, $mode_id, $revision) {
        if ($run->isFinished())
            throw new Exception("Cannot info to a run that is finished.");

        mysql_query("INSERT INTO awfy_build
                     (run_id, mode_id, cset)
                     VALUES
                     ({$run->id}, $mode_id, '".mysql_real_escape_string($revision)."')")
                     or die("ERROR: " . mysql_error());
        return new Build(mysql_insert_id());
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
