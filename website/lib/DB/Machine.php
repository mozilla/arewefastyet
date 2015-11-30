<?php

require_once("DB.php");

class Machine extends DB {

    public static $db = "awfy_machine";

    public function __construct($id) {
        $this->id = $id;
    }

    public function description() {
        return $this->select("description");
    }
}
