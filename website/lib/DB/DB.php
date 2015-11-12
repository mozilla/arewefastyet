<?php

class DB {

    public static function FromId($id) {
        $id = (int) $id;
        $qField = mysql_query("SELECT id from ".static::$db."
                               WHERE id = {$id}") or die(mysql_error());
        if (mysql_num_rows($qField) == 0)
            return null;
        $field = mysql_fetch_object($qField);
        $class = get_called_class();
        return new $class($field->id);
    }

    public function select($field) {
        $qField = mysql_query("SELECT $field as field from {$this::$db}
                               WHERE id = {$this->id}") or die(mysql_error());
        $field = mysql_fetch_object($qField);
        if (!isset($field->field))
            throw new Exception("Unknown field or non existed id.");
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

