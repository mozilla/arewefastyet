<?php

require_once(__DIR__."/../internals.php");
require_once("DB.php");
require_once("Mode.php");
require_once("Machine.php");

class TaskRecipe extends DB {
    public static $db = "control_task_recipe";

    public function __construct($id) {
        $this->id = $id;
    }

    public function name() {
        return $this->select("name");
    }

    public function description() {
        return $this->select("description");
    }

    public function task() {
        return $this->select("task");
    }

    public function control_unit_id() {
        return $this->select("control_unit_id");
    }

    public function inputs() {
        $inputs = [];
        $task = $this->task();
        if (strpos($task, "{revision}") !== false) {
            $inputs[] = array(
                "id" => "revision",
                "type" =>"alphanum",
                "name" => "Revision",
            );
        }
        if (strpos($task, "{repo}") !== false) {
            $inputs[] = array(
                "id" => "repo",
                "type" => "select",
                "name" => "Repository",
                "options" => ["mozilla-try", "mozilla-inbound", "mozilla-aurora", "mozilla-beta"]
            );
        }
        if (strpos($task, "{shell_repo}") !== false) {
            $inputs[] = array(
                "id" => "shell_repo",
                "type" => "select",
                "name" => "Repository",
                "options" => ["mozilla-try", "mozilla"]
            );
        }
        if (strpos($task, "{browser_benchmark}") !== false) {
            $inputs[] = array(
                "id" => "browser_benchmark",
                "type" => "select",
                "name" => "Benchmark",
                "options" => ["remote.octane", "remote.dromaeo", "remote.massive",
                              "remote.jetstream", "remote.speedometer", "remote.speedometer-misc",
                              "remote.kraken", "remote.sunspider", "remote.browsermark",
                              "remote.wasm"]
            );
        }
        if (strpos($task, "{shell_benchmark}") !== false) {
            $inputs[] = array(
                "id" => "shell_benchmark",
                "type" => "select",
                "name" => "Benchmark",
                "options" => ["shell.octane", "shell.sunspider", "shell.kraken", "shell.assorted",
                              "shell.asmjsapps", "shell.asmjsmicro",
                              "shell.dart", "shell.sixspeed", "shell.ares6"]
            );
        }
        if (strpos($task, "{autodir}") !== false) {
            $inputs[] = array(
                "id" => "autodir",
                "type" => "auto",
            );
        }
        return $inputs;
    }

    function fill($values) {
        $task = $this->task();
        $inputs = $this->inputs();
        foreach ($inputs as $input) {
            if ($input["type"] == "auto" && $input["id"] == "autodir") {
                if (isset($values["shell_repo"]) &&
                    preg_match("/[a-z]*-[a-z]*/i", $values["shell_repo"]))
                {
                    $task = str_replace("{autodir}", $values["shell_repo"], $task);
                } else if (isset($values["repo"]) &&
                    preg_match("/[a-z]*-[a-z]*/i", $values["repo"]))
                {
                    $task = str_replace("{autodir}", $values["repo"], $task);
                } else {
                    $task = str_replace("{autodir}", ".", $task);
                }
            }
            if (!isset($values[$input["id"]]))
                continue;

            if ($input["type"] == "alphanum" && ctype_alnum($values[$input["id"]])) {
                $task = str_replace("{".$input["id"]."}", $values[$input["id"]], $task);
                continue;
            }

            if ($input["type"] == "select" && in_array($values[$input["id"]], $input["options"])) {
                $task = str_replace("{".$input["id"]."}", $values[$input["id"]], $task);
                continue;
            }
        }

        return $task;
    }

    public static function all() {
        $qTasks = awfy_query("SELECT id FROM control_task_recipe");
        $tasks = Array();
        while ($task = mysql_fetch_object($qTasks)) {
            $tasks[] = new TaskRecipe($task->id);
        }
        return $tasks;
    }
}
