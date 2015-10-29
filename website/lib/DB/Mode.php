<?php

class Mode {

    // db: awfy_mode
    function __construct($id) {
        $this->id = $id;
    }

    function vendor() {
        $qMode = mysql_query("SELECT vendor_id
                              FROM awfy_mode
                              WHERE id = {$this->id}");
        $mode = mysql_fetch_object($qMode);
        return $mode->vendor_id;
    }

    function mode() {
        $qMode = mysql_query("SELECT mode
                              FROM awfy_mode
                              WHERE id = {$this->id}");
        $mode = mysql_fetch_object($qMode);
        return $mode->mode;
    }

    function id() {
        return $this->id;
    }
}

