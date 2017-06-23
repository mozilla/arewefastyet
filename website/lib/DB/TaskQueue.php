<?php

require_once(__DIR__."/../internals.php");
require_once("QueuedTask.php");

class TaskQueue {

    // db: control_task_queue
    function __construct($unit_id) {
        $this->unit_id = $unit_id;
    }

    // Returns if there is a task still running. 
    function has_active_task() {
        $qTask = awfy_query("SELECT id 
                             FROM control_task_queue
                             WHERE control_unit_id = {$this->unit_id} AND
                                   start > 0 AND
                                   finish = 0
                             ORDER BY id LIMIT 1");
        return mysql_num_rows($qTask) != 0;
    }

    function get_active_task() {
        $qTask = awfy_query("SELECT id 
                             FROM control_task_queue
                             WHERE control_unit_id = {$this->unit_id} AND
                                   start > 0 AND
                                   finish = 0
                             ORDER BY id LIMIT 1");
        $task = mysql_fetch_object($qTask);
        return new QueuedTask($task->id);
    }

    function has_queued_tasks() {
        $qTask = awfy_query("SELECT id
                             FROM control_task_queue
                             WHERE control_unit_id = {$this->unit_id} AND
                                   start = 0
                             ORDER BY id LIMIT 1");
        return mysql_num_rows($qTask) != 0;
    }

    function get_queued_tasks() {
        $qTask = awfy_query("SELECT id
                             FROM control_task_queue
                             WHERE control_unit_id = {$this->unit_id} AND
                                   start = 0
                             ORDER BY id");
		$tasks = Array();
		while ($task = mysql_fetch_object($qTask)) {
			$tasks[] = QueuedTask::FromId($task->id);
		}
		return $tasks;
    }

    function last_tasks($limit = 10) {
        $qTask = awfy_query("SELECT id
                             FROM control_task_queue
                             WHERE control_unit_id = {$this->unit_id}
                             ORDER BY id DESC LIMIT $limit");
		$tasks = Array();
		while ($task = mysql_fetch_object($qTask)) {
			$tasks[] = QueuedTask::FromId($task->id);
		}
		return $tasks;
    }

    function last_finished_task() {
        $qTask = awfy_query("SELECT id
                             FROM control_task_queue
                             WHERE control_unit_id = {$this->unit_id} AND
                                   finish > 0
                             ORDER BY finish DESC LIMIT 1");
        $task = mysql_fetch_object($qTask);
		if (!$task) return null;
        return new QueuedTask($task->id);
    }

    function get_oldest_available_queued_task() {
        $qTask = awfy_query("SELECT id
                             FROM control_task_queue
                             WHERE control_unit_id = {$this->unit_id} AND
                                   start = 0 AND
                                   available_at <= UNIX_TIMESTAMP()
                             ORDER BY id LIMIT 1");
		if (mysql_num_rows($qTask) == 0)
			return null;
        $task = mysql_fetch_object($qTask);
        return new QueuedTask($task->id);
    }
}
