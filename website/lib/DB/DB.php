<?php

require_once(__DIR__."/../internals.php");

class DB {

    public static function FromId($id) {
        $id = (int) $id;
        $qField = awfy_query("SELECT id from ".static::$db." WHERE id = {$id}");
        if (mysql_num_rows($qField) == 0)
            return null;
        $field = mysql_fetch_object($qField);
        $class = get_called_class();
        return new $class($field->id);
    }

    public function select($field) {
        $qField = awfy_query("SELECT $field as field from {$this::$db} WHERE id = {$this->id}");
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
        awfy_query("UPDATE {$this::$db}
                    SET $field = $value
                    WHERE id = {$this->id}");
    }
}

