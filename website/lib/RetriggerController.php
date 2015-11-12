<?php

require_once("ManipulateTask.php");
require_once("VersionControl.php");
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

            $task = new ManipulateTask($task->task);
            if ($mode_id != 0)
                $task->update_modes(Array($mode->mode()));

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

    public function convertToRevision($mode_id, $revision, $run_before_id, $run_after_id) {
        $mode = new Mode($mode_id);

        foreach ($this->tasks as $task) {
            $task->update_modes(Array("jmim"/*$mode->mode()*/));
            $task->setBuildRevision($revision);
            $task->setSubmitterOutOfOrder("jmim"/*$mode->mode()*/, $revision, $run_before_id, $run_after_id);
        }
    }

	private function normalizeBenchmark($benchmark) {
		$benchmark = str_replace("local.", "", $benchmark);
		$benchmark = str_replace("remote.", "", $benchmark);
		$benchmark = str_replace("shell.", "", $benchmark);
		$benchmark = str_replace("-", "", $benchmark);
		$benchmark = str_replace("misc", "assorted", $benchmark);
		$benchmark = str_replace("asmjsubench", "asmjsmicro", $benchmark);
		echo $benchmark;
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

    public function enqueue() {
        if ($this->unit_id == 0)
            throw new Exception("No control_unit specified.");

        foreach ($this->tasks as $task) {
			mysql_query("INSERT INTO control_task_queue
                         (control_unit_id, task)
                         VALUES ({$this->unit_id}, '".mysql_escape_string($task->task())."')") or throw_exception(mysql_error());
        }
    }
}
