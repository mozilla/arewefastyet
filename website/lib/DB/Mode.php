<?php

require_once("Vendor.php");
require_once("DB.php");

class Mode extends DB {

    public static $db = "awfy_mode";

    public function __construct($id) {
        $this->id = $id;
    }

    public static function FromMode($mode) {
        $query = "SELECT id FROM awfy_mode
                  WHERE mode = '" . mysql_real_escape_string($mode) . "'";
        $results = mysql_query($query) or die(mysql_error());
        if (!$results || mysql_num_rows($results) < 1)
            return null;
        $row = mysql_fetch_array($results);
        return new Mode($row[0]);
    }

    public function vendor_id() {
        return $this->select("vendor_id");
    }

    public function vendor() {
        return new Vendor($this->vendor_id());
    }

    public function mode() {
        return $this->select("mode");
    }

    public function name() {
        return $this->select("name");
    }
}
