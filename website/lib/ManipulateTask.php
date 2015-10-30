<?php

include_once "BashInterpreter.php";
include_once "Task.php";

class ManipulateTask extends Task {

    public function update_benchmarks($new_benchmarks) {
        //Note: Impossible to add new benchmarks using this command. Only possible to prune ones.
        $old_benchmarks = $this->benchmarks();
        $removed_benchmarks = array_diff($old_benchmarks, $new_benchmarks);
        foreach($removed_benchmarks as $removed) {
            $this->task = BashInterpreter::removeFlagFromCommands($this->task, "python execute.py", "-b ".$removed);
        }

        $this->optimize();
    }

    public function update_configs($new_configs) {
        //Note: Impossible to add new configs using this command. Only possible to prune ones.
        $old_configs= $this->configs();
        $removed_configs = array_diff($old_configs, $new_configs);
        foreach($removed_configs as $removed) {
            $this->task = BashInterpreter::removeFlagFromCommands($this->task, "python execute.py", "-c ".$removed);
        }

        $this->optimize();
    }

    public function update_engines($new_engines) {
        //Note: Impossible to add new engines using this command. Only possible to prune ones.
        $old_engines = $this->engines();
        $removed_engines = array_diff($old_engines, $new_engines);

        // Build engines
        $commands = BashInterpreter::matchCommand($this->task, "python build.py");
        foreach ($commands as $command) {
            $source_matches = BashInterpreter::matchFlag($command, "-s");
			$source_rules = $this->source_rules();
            $engine = $source_rules[$source_matches[0]];
            if (in_array($engine, $removed_engines)) {
                $this->removeBuildOrDownloadCommand($command);
            }
        }

        $this->optimize();
    }

    public function update_modes($modes) {
        $engines = Array();
        $configs = Array();
        $mode_rules = array_flip($this->mode_rules());

        foreach ($modes as $mode) {
            $rule = $mode_rules[$mode];
            $rule = split(",", $rule);
            $engines[] = $rule[0];
            $configs[] = $rule[1];
        }

        $this->update_engines($engines);
        $this->update_configs($configs);
    }

    public function setBuildRevisionToTip() {
        $this->removeBuildRevisionInfo();
    }

    public function setBuildRevision($new_revision) {
        $this->removeBuildRevisionInfo();
        $this->task = BashInterpreter::addFlagToCommands($this->task, "python build.py", "-r ".$new_revision);
    }

    public function setSubmitterOutOfOrder($mode_name, $revision, $run_before_id, $run_after_id) {
        $commands = BashInterpreter::matchCommand($this->task, "python submitter.py");
        foreach ($commands as $command) {
            if (count(BashInterpreter::matchFlag($command, "-c")) > 0 ||
                count(BashInterpreter::matchFlag($command, "--create")) > 0)
            {
                $flag  = "--revision ".$revision." ";
                $flag .= "--mode ".$mode_name." ";
                $flag .= "--run_before ".$run_before_id." ";
                $flag .= "--run_after ".$run_after_id;
                $this->task = BashInterpreter::addFlagToCommand($this->task, $command, $flag);
            }
        }
    }

    private function removeBuildRevisionInfo() {
        $commands = BashInterpreter::matchCommand($this->task, "python download.py");
        if (count($commands) != 0)
            throw new Exception("Not yet supported to specify revision for downloaded builds.");

        $commands = BashInterpreter::matchCommand($this->task, "python build.py");
        foreach ($commands as $command) {
            $revision_matches = BashInterpreter::matchFlag($command, "-r");
            foreach ($revision_matches as $revision) {
                $this->task = BashInterpreter::removeFlagFromCommand($this->task, $command, "-r ".$revision);
            }
        }
    }

    private function removeBuildOrDownloadCommand($command) {
        $output_matches = BashInterpreter::matchFlag($command, "-o");
        $this->task = BashInterpreter::removeCommand($this->task, $command);
        if (count($output_matches) == 0) {
            // If there was no output dir specified, remove all executes where no engine dir is given.
            // or where the default 'output' dir is specified. 
            $commands = BashInterpreter::matchCommand($this->task, "python execute.py");
            foreach ($commands as $command) {
                $engine_matches = BashInterpreter::matchFlag($command, "-e");
                if (count($engine_matches) == 0) {
                    $this->task = BashInterpreter::removeCommand($this->task, $command);
                    continue;
                } 

                foreach ($engine_matches as $engineDir) {
                    if (BashInterpreter::sameDir($engineDir, "output")) {
                        $this->task = BashInterpreter::removeFlagFromCommand($this->task, $command, "-e ".$engineDir);
                        if (count($engine_matches) == 1)
                            $this->task = BashInterpreter::removeCommand($this->task, $command);
                    }
                }
            }
        } else {
            $outputDir = $output_matches[0];
            $commands = BashInterpreter::matchCommand($this->task, "python execute.py");
            foreach ($commands as $command) {
                $engine_matches = BashInterpreter::matchFlag($command, "-e");
                foreach ($engine_matches as $engineDir) {
                    if (BashInterpreter::sameDir($engineDir, $outputDir)) {
                        $this->task = BashInterpreter::removeFlagFromCommand($this->task, $command, "-e ".$engineDir);
                        if (count($engine_matches) == 1)
                            $this->task = BashInterpreter::removeCommand($this->task, $command);
                    }
                }
            }

        }
    }

    private function optimize() {
        $commands = BashInterpreter::matchCommand($this->task, "python execute.py");
        foreach ($commands as $command) {
            // Any execute without benchmarks don't need to get run.
            if (count(BashInterpreter::matchFlag($command, "-b")) == 0)
                $this->task = BashInterpreter::removeCommand($this->task, $command);

        }
    }
}

