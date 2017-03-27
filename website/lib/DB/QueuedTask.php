<?php

require_once("DB.php");

class QueuedTask extends DB {

    public static $db = "control_task_queue";

    function __construct($id) {
        $this->id = $id;
    }

    function setStarted() {
        $this->updateRaw("start", "UNIX_TIMESTAMP()");
    }

    function setFinished() {
        $this->updateRaw("finish", "UNIX_TIMESTAMP()");
    }
    
    function reportError($error) {
        $this->setFinished();
        $this->updateString("error", empty($error) ? "unknown error" : $error);
    }

    function setOutput($output) {
		$this->updateString("output", $output);
	}

    function task() {
        return $this->select("task");
    }

	function start_time() {
        return $this->select("start");
	}

	function finish_time() {
        return $this->select("finish");
	}

	function available_time() {
		return $this->select("available_at");
	}

	function set_available_time($time) {
		return $this->updateInt("available_at", $time);
	}

	function control_unit_id() {
        return $this->select("control_unit_id");
	}

	function control_tasks_id() {
        return $this->select("control_tasks_id");
	}

	function output() {
		return $this->select("output");
	}

	function hasEmail() {
		return $this->select("email") != "";
	}

	function email() {
		return $this->select("email");
	}

	function hasError() {
		return $this->select("error") != "";
	}

	function error() {
		return $this->select("error");
	}

	static function insert($control_unit_id, $task, $email) {
		$control_unit_id = (int)$control_unit_id;
		$task = mysql_real_escape_string($task);
		$email = mysql_real_escape_string($email);

		mysql_query("INSERT INTO control_task_queue
					 (control_unit_id, task, email)
					 VALUES
					 ($control_unit_id, '$task', '$email')");
		return mysql_insert_id();
	}
}

