<?php

class Revision {
	
	public function __construct($author, $date, $revision, $message) {
		$this->author = $author;
		$this->date = $date;
		$this->revision = $revision;
		$this->message = $message;
	}

	public function author() {
		return $this->author;
	}
	public function date() {
		return $this->date;
	}
	public function revision() {
		return $this->revision;
	}
	public function message() {
		return $this->message;
	}

}
