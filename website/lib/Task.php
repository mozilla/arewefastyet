<?php

class Task {

    // The build function contains the 'source' it needs to fetch
    // the code from. We need to know which source is which engine.
    // This makes the transition from source to engine. 
    // Note: an engine can have multiple sources.
    public function source_rules() {
        return [
            "mozilla" => "firefox",
            "v8" => "chrome",
            "webkit" => "webkit"
        ];
    }

    // The execute function looks at engine+config to decide which
    // mode it should send this data to. These contain the default rules.
    // Though it is possible to add some extra rules in the task
    // itself. These are not accounted for (TODO).
    public function mode_rules() {
        return [
            "firefox,default" => "jmim",
            "firefox,noasmjs" => "noasmjs",
            "firefox,unboxedobjects" => "unboxedobjects",
            "firefox,testbedregalloc" => "testbed",
            "chrome,default" => "v8",
            "chrome,turbofan" => "v8-turbofan",
            "webkit,default" => "jsc",
            "native,default" => "clang",
            "servo,default" => "servo"
        ];
    }

    public function __construct($task) {
        $this->task = $task;
    }

    public function task() {
        return $this->task;
    }

    public function configs() {
        $configs = [];
        $commands = BashInterpreter::matchCommand($this->task, "python execute.py");
        foreach ($commands as $command) {
            $config_matches = BashInterpreter::matchFlag($command, "-c");
            foreach ($config_matches as $match) {
                $configs[] = $match;
            }
        }
        return array_unique($configs);
    }

    public function engines() {
        $engines = [];

        // Fetch all engines that have been build.
        $commands = BashInterpreter::matchCommand($this->task, "python build.py");
        foreach ($commands as $command) {
            $source_matches = BashInterpreter::matchFlag($command, "-s");
            if (count($source_matches) != 1)
                throw new Error("Expected one match.");

            $engines[] = $this->source_rules()[$source_matches[0]];
        }

        // Fetch all engines that have been downloaded.
        // TODO.
        return array_unique($engines);
    }

    public function modes() {
        $configs = $this->configs();
        $engines = $this->engines();
        $mode_rules = $this->mode_rules();

        $modes = [];
        foreach ($configs as $config) {
            foreach ($engines as $engine) {
                $rule = $engine.",".$config;
                if (isset($mode_rules[$rule])) {
                    $modes[] = $mode_rules[$rule];
                }
            }
        }
        return $modes;
    }

    public function benchmarks() {
        $configs = [];
        $commands = BashInterpreter::matchCommand($this->task, "python execute.py");
        foreach ($commands as $command) {
            $config_matches = BashInterpreter::matchFlag($command, "-b");
            foreach ($config_matches as $match) {
                $configs[] = $match;
            }
        }
        return array_unique($configs);
    }
}
