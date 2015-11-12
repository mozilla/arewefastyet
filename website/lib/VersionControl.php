<?php

require_once("VersionControl/HGWeb.php");
require_once("DB/Mode.php");
require_once("DB/Vendor.php");

class VersionControl {

    public function forMode($mode_id) {
        $mode = Mode::FromId($mode_id);
        $vendor = Vendor::FromId($mode->vendor_id());

        $url = $vendor->csetURL();
        if (strpos($url, "hg.mozilla.org") !== false)
            return new HGWeb($url);

        throw new Exception("Not implemented version control system.");
    }
}
