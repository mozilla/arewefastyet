<?php

require_once("ManipulateTask.php");
require_once("DB/Mode.php");

class RetriggerController {

    public function __construct() {
        $this->tasks = Array();
        $this->unit_id = 0;
    }

    public static function fromUnit($unit_id) {
        $retrigger = new RetriggerController();
        $retrigger->unit_id = $unit_id;

		$qTask = mysql_query("SELECT * FROM control_tasks WHERE control_unit_id = $unit_id");
        while ($task = mysql_fetch_object($qTask)) {
            $task = new ManipulateTask($task->task);
            $retrigger->tasks[] = $task;
        }
        return $retrigger;
    }

    public static function fromMachine($machine, $mode_id = 0) {
        $retrigger = new RetriggerController();
        $mode = new Mode($mode_id);

		$qTask = mysql_query("SELECT * FROM control_tasks WHERE machine_id = $machine");
        while ($task = mysql_fetch_object($qTask)) {
            if (!($mode_id == 0 || $task->mode_id == 0 || $task->mode_id == $mode_id))
                continue;

            $task = new ManipulateTask($task->task);
            if ($mode_id != 0)
                $task->update_modes($mode->mode());

            $retrigger->tasks[] = $task;

            if ($this->unit_id != 0 && $this->unit_id != $task->control_unit_id)
                throw new Exception("Only one machine allowed.");

            $this->unit_id = $task->control_unit_id;
        }
        return $retrigger;
    }

    public function setRevision($revision) {
        foreach ($this->tasks as $task) {
            $task->setRevision($revision);
        }
    }

    public function enqueue() {
        if ($this->unit_id == 0)
            throw new Exception("No control_unit specified.");

        foreach ($this->tasks as $task) {
			mysql_query("INSERT INTO control_task_queue
                         (control_unit_id, task)
                         VALUES ({$this->unit_id}, '".mysql_escape_string($task->task())."')");
        }
    }
}

