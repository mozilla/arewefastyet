<?php

class QueuedTask {

    // db: control_task_queue
    function __construct($id) {
        $this->id = $id;
    }

    function setBusy() {
        mysql_query("UPDATE control_task_queue SET busy = 1 WHERE id = {$this->id}") or die(mysql_error());
    }

    function setFinished() {
        mysql_query("DELETE FROM control_task_queue WHERE id = {$this->id}");
    }

    function task() {
        $qTask = mysql_query("SELECT task
                              FROM control_task_queue
                              WHERE id = {$this->id}");
        $task = mysql_fetch_object($qTask);
        return $task->task;
    }

    function id() {
        return $this->id;
    }
}

