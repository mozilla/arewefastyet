<?php

require_once("DB.php");

class Build {

    public static $db = "awfy_build";

    public function __construct($id) {
        $this->id = $id;
    }

    public static function withRunAndMode($run_id, $mode_id) {
        $qBuild = mysql_query("SELECT id FROM awfy_build
                               WHERE run_id = $run_id AND
                                     mode_id = $mode_id
                               LIMIT 1") or die(mysql_error());
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
        return $this->select("revision");
    }

    public function run_id() {
        return $this->select("run_id");
    }

    public function mode_id() {
        return $this->select("mode_id");
    }
}
