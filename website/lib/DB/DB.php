<?php

class DB {

    public function select($field) {
        $qField = mysql_query("SELECT $field as field from {$this::$db}
                               WHERE id = {$this->id}") or die(mysql_error());
        $field = mysql_fetch_object($qField);
        return $field->field;
    }
}

