<?php

require_once("ManipulateTask.php");
require_once("VersionControl.php");
require_once("DB/Mode.php");
require_once("DB/Run.php");
require_once("DB/Build.php");

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
			$available_at = 0;
			if ($task->delay)
				$available_at = $task->last_scheduled + $task->delay;
            $task = new ManipulateTask($task->id, $task->task, $available_at);
            $retrigger->tasks[] = $task;
        }
        return $retrigger;
    }

    public static function fromMachine($machine_id, $mode_id = 0) {
        $retrigger = new RetriggerController();
        $mode = new Mode($mode_id);

        $qTask = mysql_query("SELECT * FROM control_tasks WHERE machine_id = $machine_id") or die(mysql_error());
        while ($task = mysql_fetch_object($qTask)) {
            if (!($mode_id == 0 || $task->mode_id == 0 || $task->mode_id == $mode_id))
                continue;

            if ($retrigger->unit_id != 0 && $retrigger->unit_id != $task->control_unit_id)
                throw new Exception("Only one machine allowed.");

            $retrigger->unit_id = $task->control_unit_id;

			$available_at = 0;
			if ($task->delay)
				$available_at = $task->last_scheduled + $task->delay;

            $task = new ManipulateTask($task->id, $task->task, $available_at);
            if ($mode_id != 0)
                $task->update_modes(Array($mode->mode()));

            if (count($task->modes()) == 0)
                continue;

            $retrigger->tasks[] = $task;
        }
        return $retrigger;
    }

    public static function retriggerable($machine_id, $mode_id) {
        $retrigger = RetriggerController::fromMachine($machine_id, $mode_id);
        if (count($retrigger->tasks) == 0)
            return false;

        try {
            VersionControl::forMode($mode_id);    
        } catch(Exception $e) {
            return false;
        }

        return true;
    }

    public static function fillQueue($unit_id) {
        $retrigger = RetriggerController::fromUnit($unit_id);

        // Remove all tasks that still have a task left in the queue.
        $tasks = $retrigger->tasks;
        $retrigger->tasks = [];
        foreach ($tasks as $task) {
            $qTask = mysql_query("SELECT id
                                  FROM control_task_queue
                                  WHERE control_tasks_id = {$task->control_tasks_id} AND
                                        start > 0 AND
                                        finish = 0
                                  ORDER BY id LIMIT 1") or die(mysql_error());
            if (mysql_num_rows($qTask) != 0)
                $retrigger->tasks[] = $task;
        }

		if (count($retrigger->tasks) == 0)
			return false;
        $retrigger->enqueueRespectDelay();
		return true;
	}

    public static function computeBeforeAfterId($machine_id, $mode_id, $revision) {
		$version_control = VersionControl::forMode($mode_id); 
		if (!$version_control->exists($revision))
			throw new Exception("Revision does not exists.");
		$next_revision = $revision;
		$run = null;
		$it = 0;
		while (!$run) {
			$revisions = $version_control->before($next_revision);
			assert($revisions[0] == $revision);
			$run = Run::closestRun($machine_id, $mode_id, $revisions);
			$next_revision = $revisions[count($revisions) - 1]->revision();
			if ($it > 50)
				throw new Exception("Too much revisions given revision and previous datapoint.");
		}
		
		$run_before_id = $run->id;

		$next = $run->next();
		while (true) {
			$cur = $next;
			$next = $next->next();

			if (!$cur)
				throw new Exception("Couldn't find a revision with results after the given revision.");
			if (!$cur->isFinished())
				continue;
		    if ($cur->hasError())
				continue;
            if (!Build::withRunAndMode($cur->id, $mode_id))
				continue;
			break;
		}

		$run_after_id = $cur->id;
		return Array($run_before_id, $run_after_id);
	}
    public function convertToRevision($mode_id, $revision, $run_before_id, $run_after_id) {
        $mode = new Mode($mode_id);
        foreach ($this->tasks as $task) {
            $task->update_modes(Array("jmim"/*$mode->mode()*/));
            $task->setBuildRevision($revision);
            $task->setSubmitterOutOfOrder("jmim"/*$mode->mode()*/, $revision, $run_before_id, $run_after_id);
        }
    }

    private function normalizeBenchmark($benchmark) {
		// Keep in accordance with retrigger/index.php
        $benchmark = str_replace("local.", "", $benchmark);
        $benchmark = str_replace("remote.", "", $benchmark);
        $benchmark = str_replace("shell.", "", $benchmark);
        $benchmark = str_replace("-", "", $benchmark);
		if ($benchmark == "misc")
			$benchmark = "assorted";
		if ($benchmark == "ss")
			$benchmark = "sunspider";
		if ($benchmark == "asmjsubench")
			$benchmark = "asmjsmicro";
        return $benchmark;
    }

    private function benchmarksEqual($benchmark1, $benchmark2) {
        return $this->normalizeBenchmark($benchmark1) == $this->normalizeBenchmark($benchmark2);
    }

    public function selectBenchmarks($benchmarks) {
        foreach ($this->tasks as $task) {
            $new_benchmarks = Array();
            foreach ($task->benchmarks() as $task_benchmark) {
                foreach ($benchmarks as $benchmark) {
                    if ($this->benchmarksEqual($benchmark, $task_benchmark))
                        $new_benchmarks[] = $task_benchmark;
                }
            }
            $task->update_benchmarks($new_benchmarks);
        }
    }

    public function enqueueNow() {
        if ($this->unit_id == 0)
            throw new Exception("No control_unit specified.");

        foreach ($this->tasks as $task) {
            mysql_query("INSERT INTO control_task_queue
                         (control_unit_id, control_tasks_id, task)
                         VALUES ({$this->unit_id}, ".$tasks->control_tasks_id().",
                                 '".mysql_escape_string($task->task())."')") or throw_exception(mysql_error());
            if ($this->control_tasks_id != 0) {
                $available_at = $task->available_at();
                $last_scheduled = ($available_at < time()) ? "UNIX_TIMESTAMP()" : $available_at;
                mysql_query("UPDATE control_tasks
                             SET last_scheduled = ".$last_scheduled."
                             WHERE id = $task->control_tasks_id()") or die(mysql_error());
            }
        }
    }

    public function enqueueRespectDelay() {
        if ($this->unit_id == 0)
            throw new Exception("No control_unit specified.");

        foreach ($this->tasks as $task) {
            $available_at = $task->available_at();
            mysql_query("INSERT INTO control_task_queue
                         (control_unit_id, control_tasks_id, available_at)
                         VALUES ({$this->unit_id}, ".$task->control_tasks_id().",
                                 '".mysql_escape_string($task->task())."',".
                                 $available_at.")") or throw_exception(mysql_error());
            if ($this->control_tasks_id != 0) {
                $last_scheduled = ($available_at < time()) ? "UNIX_TIMESTAMP()" : $available_at;
                mysql_query("UPDATE control_tasks
                             SET last_scheduled = ".$last_scheduled."
                             WHERE id = $task->control_tasks_id()") or die(mysql_error());
            }
        }
    }
}
