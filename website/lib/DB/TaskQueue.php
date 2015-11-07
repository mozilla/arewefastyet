<?php

require_once("QueuedTask.php");

class TaskQueue {

    // db: control_task_queue
    function __construct($unit_id) {
        $this->unit_id = $unit_id;
    }

    // Returns if there is a task still running. 
    function has_active_task() {
        $qTask = mysql_query("SELECT id 
                              FROM control_task_queue
                              WHERE control_unit_id = {$this->unit_id} AND
                                    start > 0 AND
                                    finish = 0
                              ORDER BY id LIMIT 1") or die(mysql_error());
        return mysql_num_rows($qTask) != 0;
    }

    function get_active_task() {
        $qTask = mysql_query("SELECT id 
                              FROM control_task_queue
                              WHERE control_unit_id = {$this->unit_id} AND
                                    start > 0 AND
                                    finish = 0
                              ORDER BY id LIMIT 1") or die(mysql_error());
        $task = mysql_fetch_object($qTask);
        return new QueuedTask($task->id);
    }

    function has_queued_tasks() {
        $qTask = mysql_query("SELECT id
                              FROM control_task_queue
                              WHERE control_unit_id = {$this->unit_id} AND
                                    start = 0
                              ORDER BY id LIMIT 1") or die(mysql_error());
        return mysql_num_rows($qTask) != 0;

    }

    function get_oldest_queued_tasks() {
        $qTask = mysql_query("SELECT id
                              FROM control_task_queue
                              WHERE control_unit_id = {$this->unit_id} AND
                                    start = 0
                              ORDER BY id LIMIT 1") or die(mysql_error());
        $task = mysql_fetch_object($qTask);
        return new QueuedTask($task->id);
    }
}
