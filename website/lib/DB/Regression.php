<?php
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once("DB.php");
require_once("Build.php");

class Regression extends DB {
 
    public static $db = "awfy_regression";

    public function __construct($id) {
        $this->id = $id;
    }

    function bug() {
        return $this->select("bug");
    }

    function status() {
        return $this->select("status");
    }

    function build_id() {
        return $this->select("build_id");
    }

	function build() {
		return Build::FromId($this->build_id());
	}

    function prev_build_id() {
        return $this->select("prev_build_id");
    }

	function prev_build() {
		return Build::FromId($this->prev_build_id());
	}
}
