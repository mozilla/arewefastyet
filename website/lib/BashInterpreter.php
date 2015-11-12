<?php

class BashInterpreter {
    public static function matchCommand($text, $command) {
        $command = str_replace("/", "\/", $command);
        preg_match_all("/(".$command." [^;$\n\r\r\n#]*)/", $text, $matches);
        return $matches[1];
    }

    public static function matchFlag($command, $flag) {
        $flag = str_replace("/", "\/", $flag);
        preg_match_all("/".$flag." ([a-zA-Z0-9.~\-\/]*)/", $command, $matches);
        return $matches[1];
    }

    public static function removeFlagFromCommand($text, $full_command, $full_flag) {
        $replaced = str_replace($full_flag, "", $full_command);
        $text = str_replace($full_command, $replaced, $text);
        return $text;
    }

    public static function addFlagToCommands($text, $command, $full_flag) {
        return str_replace($command, $command." ".$full_flag, $text);
    }

    public static function addFlagToCommand($text, $full_command, $full_flag) {
        return str_replace($full_command, $full_command." ".$full_flag, $text);
    }

    public static function removeFlagFromCommands($text, $command, $full_flag) {
        foreach(BashInterpreter::matchCommand($text, $command) as $match) {
            $text = BashInterpreter::removeFlagFromCommand($text, $match, $full_flag);
        }
        return $text;
    }

    public static function removeCommand($text, $full_command) {
        return str_replace($full_command, "", $text);
    }

    public static function normalizeDir($dir) {
        $dir = str_replace("//", "/", $dir);
        $dir = str_replace("/./", "/", $dir);
        $dir = preg_replace("#^./#", "", $dir);
        $dir = str_replace("~", '$HOME', $dir);
        $dir = preg_replace("#/$#", "", $dir);
        return $dir;
    }

    public static function sameDir($dir1, $dir2) {
        return BashInterpreter::normalizeDir($dir1) == BashInterpreter::normalizeDir($dir2);
    }
}
