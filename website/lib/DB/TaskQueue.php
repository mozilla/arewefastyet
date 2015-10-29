<?php

require_once("QueuedTask.php");

class TaskQueue {

    // db: control_task_queue
    function __construct($unit_id) {
        $this->unit_id = $unit_id;
    }

    // Returns if there is a task still running. 
    function has_active_task() {
        $qTask = mysql_query("SELECT *
                              FROM control_task_queue
                              WHERE control_unit_id = {$this->unit_id} AND busy = 1
                              ORDER BY id LIMIT 1") or die(mysql_error());
        return mysql_num_rows($qTask) != 0;
    }

    function has_queued_tasks() {
        $qTask = mysql_query("SELECT *
                              FROM control_task_queue
                              WHERE control_unit_id = {$this->unit_id} and busy = 0
                              ORDER BY id LIMIT 1") or die(mysql_error());
        return mysql_num_rows($qTask) != 0;

    }

    function pop() {
        $qTask = mysql_query("SELECT id
                              FROM control_task_queue
                              WHERE control_unit_id = {$this->unit_id} and busy = 0
                              ORDER BY id LIMIT 1") or die(mysql_error());
        $task = mysql_fetch_object($qTask);

        $task = new QueuedTask($task->id);
        $task->setBusy();

        return $task;
    }
}
