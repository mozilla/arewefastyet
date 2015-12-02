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

	function hasError() {
		return $this->select("error") != "";
	}

	function error() {
		return $this->select("error");
	}
}

