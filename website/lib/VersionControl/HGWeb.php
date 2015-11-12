<?php

require_once("Revision.php");
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

        throw new Exception("Couldn't find relationship between $revision1 and $revision2.");
    }

	public function revisions($from, $to) {
        $html = file_get_contents($this->url."pushloghtml?fromchange=$from&tochange=$to");
		preg_match_all('#<tr class="pushlogentry .*"><td>(<cite>(.*)<br/><span class="date">(.*)</span></cite>)*</td><td class="age"><a href="/integration/mozilla-inbound/rev/.*">(.*)</a></td><td><strong>(.*) &mdash; (.*)</td></tr>#', $html, $matches);

		$revisions = Array();
		$prev_date = "";	
		for ($i = 0; $i < count($matches[0]); $i++) {
			$date = empty($matches[3][$i]) ? $prev_date : $matches[3][$i];
			$revision = $matches[4][$i];
			$author = $matches[5][$i];
			$message = $matches[6][$i];

			$message = strip_tags($message);

			$revisions[] = new Revision($author, $date, $revision, $message);

			$prev_date = $date;
		}
		return $revisions;
	}
}
