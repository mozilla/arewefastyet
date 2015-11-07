<?php

class DB {

    public function select($field) {
        $qField = mysql_query("SELECT $field as field from {$this::$db}
                               WHERE id = {$this->id}") or die(mysql_error());
        $field = mysql_fetch_object($qField);
        return $field->field;
    }

	public function updateInt($field, $value) {
		$value = (int)$value;
		$this->updateRaw($field, $value);
	}

	public function updateString($field, $value) {
		$value = "'".mysql_real_escape_string($value)."'";
		$this->updateRaw($field, $value);
	}

	public function updateRaw($field, $value) {
        mysql_query("UPDATE {$this::$db}
			         SET $field = $value
                     WHERE id = {$this->id}") or throw_exception(mysql_error());
	}
}

