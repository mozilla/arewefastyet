<?php

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require_once(__DIR__."/../lib/DB/Score.php");

class ScoreTools {

    // Accepts Score and Breakdown
    static function build($score) {
        if ($score instanceof Score)
            return $score->build();
        else
            return $score->score()->build();
    }

    // Accepts Score and Breakdown
    static function prevList($score, $amount = 1) {
        $list = Array();
        for ($i = 0; $i < $amount; $i++) {
            $score = $score->prev();
            if (!$score)
                return $list;
            $list[] = $score;
        }
        return $list;
    }

    // Accepts Score and Breakdown
    static function nextList($score, $amount = 1) {
        $list = Array();
        for ($i = 0; $i < $amount; $i++) {
            $score = $score->next();
            if (!$score)
                return $list;
            $list[] = $score;
        }
        return $list;
    }
}
