<?php

class BashInterpreter {
    private function startsWith($haystack, $needle)
    {
        $length = strlen($needle);
        return (substr($haystack, 0, $length) === $needle);
    }

    private function endsWith($haystack, $needle)
    {
        $length = strlen($needle);
        if ($length == 0) {
            return true;
        }

        return (substr($haystack, -$length) === $needle);
    }

    public static function matchCommand($text, $command) {
        $command = str_replace("/", "\/", $command);
        preg_match_all("/(".$command." [^;$\n\r\r\n#]*)/", $text, $matches);
        return $matches[1];
    }

    public static function matchFlag($command, $flag) {
        $flag = str_replace("/", "\/", $flag);
        preg_match_all("/".$flag." ([a-zA-Z0-9,:_.~\-\/\"]*)/", $command, $matches);
        for($i = 0; $i < count($matches[1]); $i++) {
            if (BashInterpreter::startsWith($matches[1][$i], '"') &&
                BashInterpreter::endsWith($matches[1][$i], '"'))
            {
                $matches[1][$i] = substr($matches[1][$i], 1, -1);
            }
        }
        return $matches[1];
    }

    public static function _removeFlagFromCommand($full_command, $full_flag) {
        return str_replace($full_flag, "", $full_command);
    }

    public static function removeFlagFromCommand($text, $full_command, $full_flag) {
        $replaced = BashInterpreter::_removeFlagFromCommand($full_command, $full_flag);
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
