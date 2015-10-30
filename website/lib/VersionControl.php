<?php

class VersionControl {

    public function forMode($mode_id) {
        $mode = new Mode($mode_id);
        $vendor = new Vendor($mode->vendor_id());

        $url = $vendor->csetURL();
        if (strpos($url, "hg.mozilla.org") !== false)
            return new HGWeb($url);

        throw new Exception("Not implemented version control system.");
    }

}

class HGWeb {

    public function __construct($url) {
        $this->url = str_replace("/rev/", "/", $url); 
    }

    public function equal($revision1, $revision2) {
        return $revision1 == $revision2;
    }

    public function isAfter($revision1, $revision2) {
        // test if is before
        $html = file_get_contents($this->url."pushloghtml?fromchange=$revision1&tochange=$revision2");
        if (strpos($html, "pushlogentry") !== false)
            return false;

        // test if is after
        $html = file_get_contents($this->url."pushloghtml?fromchange=$revision2&tochange=$revision1");
        if (strpos($html, "pushlogentry") !== false)
            return true;

        throw new Exception("Could find relationship between $revision1 and $revision2.");
    }

}
