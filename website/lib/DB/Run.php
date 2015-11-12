<?php

require_once("DB.php");

class Run extends DB {

    public static $db = "awfy_run";

    public function __construct($id) {
        $this->id = $id;
    }

    public static function withMachineAndSortOrder($machine_id, $sort_order) {
        $qRun = mysql_query("SELECT id FROM awfy_run
                               WHERE machine = $machine_id AND
                                     sort_order = $sort_order
                               LIMIT 1") or die(mysql_error());
        if (mysql_num_rows($qRun) == 0)
            return null;
        $run = mysql_fetch_object($qRun);
        return new Run($run->id);
    } 

    public static function insert($machine_id, $sort_order, $approx_stamp = 0) {
        $approx_stamp = intval($approx_stamp);
        if ($approx_stamp == 0)
            $approx_stamp = "UNIX_TIMESTAMP()";

        mysql_query("INSERT INTO awfy_run
                     (machine, sort_order, approx_stamp)
                     VALUES
                     ($machine_id, $sort_order, $approx_stamp)")
                     or die("ERROR: " . mysql_error());
        return new Run(mysql_insert_id());
    }

    public function finish($status, $error = "") {
        if (empty($error))
            $error = "NULL";
        else
            $error = "'" . mysql_real_escape_string($error) . "'";

        mysql_query("UPDATE awfy_run
                     SET status = $status,
                         error = $error,
                         finish_stamp = UNIX_TIMESTAMP()
                     WHERE id = {$this->id}")
            or die("ERROR: " . mysql_error());
    }

    public function isFinished() {
        return $this->select("status") > 0;
    }

    public function isOutOfOrder() {
        return !!$this->select("out_of_order");
    }

    public function hasError() {
        return $this->select("error") != "";
    }

    public function sort_order() {
        return $this->select("sort_order");
    }

    public function machine_id() {
        return $this->select("machine");
    }

    public function approx_stamp() {
        return $this->select("approx_stamp");
    }

    public function builds() {
        $qRun = mysql_query("SELECT approx_stamp from awfy_builds
                             WHERE id = {$this->id}") or die(mysql_error());
        $run = mysql_fetch_object($qRun);
        return $run->approx_stamp;
    }

    public function isBuildInfoComplete() {
        // The set of builds cannot change anymore, when the run is finished
        // or if this run is an out of order run. Out of order runs immediately
        // add their build info.
        return $this->isFinished() || $this->isOutOfOrder() || $this->hasError();
    }

    public function next() {
        $sort_order = $this->sort_order();
        $machine = $this->machine_id();
        $qRun = mysql_query("SELECT id from awfy_run
                             WHERE sort_order > {$sort_order} AND
                                   machine = {$machine}
                             ORDER BY sort_order ASC
                             LIMIT 1") or throw_exception(mysql_error());
        $run = mysql_fetch_object($qRun);
        return new Run($run->id);
    }

    public function prev() {
        $sort_order = $this->sort_order();
        $machine = $this->machine_id();
        $qRun = mysql_query("SELECT id from awfy_run
                             WHERE sort_order < {$sort_order} AND
                                   machine = {$machine}
                             ORDER BY sort_order DESC
                             LIMIT 1") or throw_exception(mysql_error());
        $run = mysql_fetch_object($qRun);
        return new Run($run->id);
    }
}
