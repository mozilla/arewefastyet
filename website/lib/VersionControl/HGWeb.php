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
        $html = file_get_contents($this->url."log?rev=$revision1%3A%3A$revision2%20and%20!$revision1");
        if (strpos($html, 'class="log_body"') !== false)
            return false;

        // test if is after
        $html = file_get_contents($this->url."log?rev=$revision2%3A%3A$revision1%20and%20!$revision2");
        if (strpos($html, 'class="log_body"') !== false)
            return true;

        throw new Exception("Couldn't find relationship between $revision1 and $revision2.");
    }

	public function exists($revision) {
        $html = file_get_contents($this->url."log?rev=$revision");
		$pattern = '#<a href="/integration/mozilla-inbound/rev/'.$revision.'">diff</a><br/>#';
		return preg_match($pattern, $html) == 1;
	}

	public function revisions($from, $to) {
        $html = file_get_contents($this->url."log?rev=$from%3A%3A$to%20and%20!$from");
		$html = preg_replace("/[\r\n]*/", "", $html); 
		$html = str_replace('<div class="title">', "\n<div class=\"title\">", $html);
		

		$pattern = '#<div class="title">([a-zA-Z0-9]*): (.*)<span class="logtags"> </span></div><div class="title_text"><div class="log_link"><a href="/integration/mozilla-inbound/rev/.*">diff</a><br/><a href="/integration/mozilla-inbound/file/.*">browse</a></div><cite>(.*)</cite> - (.*) - rev [0-9]*<br/></div><div class="log_body">.*<br/><br/></div>#';
		preg_match_all($pattern, $html, $matches);

		$revisions = Array();
		for ($i = 0; $i < count($matches[0]); $i++) {
			$date = $matches[4][$i];
			$revision = $matches[1][$i];
			$author = $matches[3][$i];
			$message = $matches[2][$i];

			$message = strip_tags($message);
			$author = html_entity_decode($author);

			$revisions[] = new Revision($author, $date, $revision, $message);
		}
		return $revisions;
	}

	public function before($revision) {
        $html = file_get_contents($this->url."shortlog/".$revision);

		$pattern = '#<a href="/integration/mozilla-inbound/rev/(.*)">diff</a><br/>#';
		preg_match_all($pattern, $html, $matches);

		$revisions = Array();
		for ($i = 0; $i < count($matches[0]); $i++) {
			$revision = $matches[1][$i];
			$revisions[] = new Revision("", "", $revision, "");
		}
		assert($revisions[0] == $revision);
		return $revisions;

	}
}
