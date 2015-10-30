<?php

class Vendor {
 
    // db: awfy_mode
    function __construct($id) {
        $this->id = $id;
    }

    function csetURL() {
        $qVendor = mysql_query("SELECT csetURL
                              FROM awfy_vendor
                              WHERE id = {$this->id}");
        $vendor = mysql_fetch_object($qVendor);
        return $vendor->csetURL;
    }

}
