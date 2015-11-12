<?php

require_once("DB.php");

class Vendor extends DB {
 
    public static $db = "awfy_vendor";

    public function __construct($id) {
        $this->id = $id;
    }

    function csetURL() {
        return $this->select("csetURL");
    }
}
