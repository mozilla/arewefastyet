<?php
// vim: set ts=4 sw=4 tw=99 et:

class Context
{
    var $vendors;
    var $vendorMap_;
    var $modes;
    var $modeMap_;
    var $machine_id;
    var $run_count;
    var $view;
    var $vars;

    function Context() {
        $this->vendors = array();
        $this->vendorMap_ = array();

        // Create an array of vendors, and a reverse mapping from DB ids.
        $query = "SELECT id, name, vendor, csetURL, browser FROM awfy_vendor";
        $result = awfy_query($query);
        while (($row = mysql_fetch_assoc($result)) !== FALSE) {
            $this->vendorMap_[$row['id']] = count($this->vendors);
            $this->vendors[] = $row;
        }

        // Create an array of modes, and a reverse mapping from DB ids.
        $query = "SELECT id, vendor_id, mode, name, color FROM awfy_mode";
        $result = awfy_query($query);
        while (($row = mysql_fetch_assoc($result)) !== FALSE) {
            $this->modeMap_[$row['id']] = count($this->modes);
            $row['vendor'] = $this->vendorMap_[$row['vendor_id']];
            $row['used'] = false;
            $this->modes[] = $row;
        }

        $this->vars = array();

        $this->machine_id = 9;
        if (isset($_GET['machine'])) {
            $this->machine_id = intval($_GET['machine']);
            $this->vars['machine'] = $this->machine_id;
        }

        $this->run_count = 32;
        if (isset($_GET['runs'])) {
            if (intval($_GET['runs']) > 1) {
                $this->run_count = intval($_GET['runs']);
                $this->vars['runs'] = $this->run_count;
            }
        }

        $this->view = 'overall';
        if (isset($_GET['view'])) {
            $view = $_GET['view'];
            if ($view == 'breakdown' || $view == 'regress') {
                $this->view = $view;
                $this->vars['view'] = $this->view;
            }
        }
    }

    function markModeUsed($mode_id) {
        $mode = $this->modeFromDB($mode_id);
        $this->modes[$mode]['used'] = true;
    }

    function url($new_vars) {
        $r = $this->vars;
        foreach ($new_vars as $key => $value) {
            if (!$value)
                unset($r[$key]);
            else
                $r[$key] = $value;
        }
        $query = http_build_query($r);
        if ($query == "")
            return "?a=b";
        return '?' . $query;
    }

    function modeFromDB($mode_id) {
        return $this->modeMap_[$mode_id];
    }
}

class RunFilter
{
    var $machine_id;
    var $run_count;
    var $suite_id;
    var $runs;
    var $runmap;
    var $idstr;
    var $modemap;
    var $series;
    var $level;

    function RunFilter($cx, $machine_id, $run_count, $suite_id) {
        $this->machine_id = $machine_id;
        $this->run_count = $run_count;
        $this->suite_id = $suite_id;
        $this->runs = $this->findRuns();
        $this->level = ($cx->view == 'overall') ? 1 : 10;

        // Get the list of run IDs for this graph.
        $ids = array();
        $this->runmap = array();
        for ($i = 0; $i < count($this->runs); $i++) {
            $ids[] = $this->runs[$i]['id'];
            $this->runmap[$this->runs[$i]['id']] = $i;
        }
        $this->idstr = implode(',', $ids);

        if (count($ids) == 0)
            die("unknown machine ID");

        // Find the list of modes that apply to this filter. Note that the
        // driver guarantees filling awfy_score only iff awfy_breakdown was
        // filled correctly, so it suffices to only check awfy_score even if
        // the filter includes a particular test case.
        $query = "SELECT s.mode_id
                  FROM awfy_score s
                  JOIN awfy_mode m ON s.mode_id = m.id
                  WHERE s.run_id IN (" . $this->idstr . ")
                  AND m.level <= " . $this->level . "
                  AND s.suite_id = " . $this->suite_id . "
                  GROUP BY s.mode_id";
        $result = awfy_query($query);
        $this->modemap = array();
        $this->series = array();
        while (($row = mysql_fetch_assoc($result)) !== FALSE) {
            $mode_id = $row['mode_id'];
            $this->modemap[$mode_id] = count($this->series);
            $this->series[] = array('mode' => $cx->modeFromDB($mode_id));
            $cx->markModeUsed($mode_id);
        }

        // To each series, add a vector that maps run indexes to changeset
        // information about that series.
        $query = "SELECT ab.run_id, ab.mode_id, ab.cset
                  FROM awfy_build ab
                  JOIN awfy_mode m ON ab.mode_id = m.id
                  WHERE ab.run_id IN (" . $this->idstr . ")
                  AND m.level <= " . $this->level;
        $result = awfy_query($query);
        while (($row = mysql_fetch_assoc($result)) !== FALSE) {
            $mode_id = $row['mode_id'];
            $run_id = $row['run_id'];
            $mode = $this->findSeriesOfMode($mode_id);
            $run = $this->findRun($run_id);
            if (!isset($this->modemap[$mode_id]))
                continue;
            $this->series[$mode]['csets'][$run] = $row['cset'];
        }
    }

    function findSeriesOfMode($mode_id) {
        return $this->modemap[$mode_id];
    }

    function findRuns() {
        $query = "SELECT fr.id, fr.stamp
                  FROM fast_run fr
                  JOIN awfy_score a
                  ON fr.id = a.run_id
                  WHERE fr.machine = " . $this->machine_id . "
                  AND fr.status <> 0
                  GROUP BY fr.id
                  ORDER BY fr.stamp DESC
                  LIMIT " . $this->run_count;
        $result = awfy_query($query);
        $rows = array();
        while (($row = mysql_fetch_assoc($result)) !== FALSE)
            $rows[] = $row;
        return array_reverse($rows);
    }

    function findRun($run_id) {
        return $this->runmap[$run_id];
    }

    function FromGET($cx, $suite_id) {
        $machine_id = $cx->machine_id;
        $run_count = $cx->run_count;
        return new RunFilter($cx, $machine_id, $run_count, $suite_id);
    }
}

class GraphBuilder
{
    var $idstr;
    var $series;
    var $runs;

    function GraphBuilder(&$cx, &$filter, $test_name = FALSE) {
        $this->runs = $filter->runs;

        // PHP arrays are by value, so this is safe.
        $this->series = $filter->series;

        // Finally, get statistics for this graph.
        if (!$test_name) {
            $query = "SELECT s.run_id, s.mode_id, s.score
                      FROM awfy_score s
                      JOIN awfy_mode m ON m.id = s.mode_id
                      WHERE s.suite_id = " . $filter->suite_id . "
                      AND m.level <= " . $filter->level . "
                      AND s.run_id IN (" . $filter->idstr . ")";
        } else {
            $query = "SELECT b.run_id, b.mode_id, b.score
                      FROM awfy_breakdown b
                      WHERE b.suite_id = " . $filter->suite_id . "
                      AND b.run_id IN (" . $filter->idstr . ")
                      AND b.test = '" . mysql_real_escape_string($test_name) . "'";
        }
        $result = awfy_query($query);
        while (($row = mysql_fetch_assoc($result)) !== FALSE) {
            $run_id = $row['run_id'];
            $mode_id = $row['mode_id'];
            $mode = $filter->findSeriesOfMode($mode_id);
            $run = $filter->findRun($run_id);
            $this->series[$mode]['scores'][$run] = $row['score'];
        }
    }
}

?>
