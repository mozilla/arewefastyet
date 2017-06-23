<?php

require_once(__DIR__."/../internals.php");
require_once("DB.php");
require_once("Mode.php");
require_once("Machine.php");

class ControlTasks extends DB {
    public static $db = "control_tasks";

    public function __construct($id) {
        $this->id = $id;
    }

    public function machine_id() {
        return $this->select("machine_id");
    }

    public function machine() {
        return Machine::FromId($this->machine_id());
    }

    public function mode_id() {
        return $this->select("mode_id");
    }

    public function mode() {
        return Mode::FromId($this->mode_id());
    }

    public function task() {
        return $this->select("task");
    }

	public static function all() {
        $qTasks = awfy_query("SELECT id FROM control_tasks");
		$tasks = Array();
		while ($task = mysql_fetch_object($qTasks)) {
			$tasks[] = new ControlTasks($task->id);
		}
		return $tasks;
	}
	public function updateLastScheduled($available_at = 0) {
		if ($available_at == 0)
			$available_at = time();
		awfy_query("UPDATE control_tasks
					SET last_scheduled = ".$available_at."
					WHERE id = ".$this->id);
	}
}
