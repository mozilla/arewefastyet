<?php
/* vim: set ts=4 sw=4 tw=99 et: */

require_once("internals.php");

init_database();

global $MACHINE;

$MACHINE = 5;
if (isset($_GET['machine']))
    $MACHINE = intval($_GET['machine']);

global $STOP_DATE;
$STOP_DATE = FALSE;
if (isset($_GET['stopDate']))
    $STOP_DATE = intval($_GET['stopDate']);

$smarty = new_smarty();
$smarty->assign('arewefastyet', 'NO.');
$smarty->assign('MACHINE', $MACHINE);

$TEST_LIST = array('ss-3bit-bits-in-byte',
                   'ss-aes',
                   'ss-base64',
                   'ss-binary-trees',
                   'ss-bits-in-byte',
                   'ss-bitwise-and',
                   'ss-cordic',
                   'v8-crypto',
                   'ss-cube',
                   'v8-deltablue',
                   'ss-dna',
                   'v8-earley-boyer',
                   'ss-fannkuch',
                   'ss-fasta',
                   'ss-format-tofte',
                   'ss-format-xparb',
                   'ss-md5',
                   'ss-morph',
                   'ss-nbody',
                   'ss-nsieve',
                   'ss-nsieve-bits',
                   'ss-partial-sums',
                   'ss-raytrace',
                   'v8-raytrace',
                   'ss-recursive',
                   'v8-regexp',
                   'v8-richards',
                   'ss-sha1',
                   'ss-spectral-norm',
                   'v8-splay',
                   'ss-tagcloud',
                   'ss-unpack-code',
                   'ss-validate-input');

Everything($smarty);

$smarty->display('individual.tpl');

function &BuildLines(&$stats, $modes, &$runIds, $test)
{
    $MODE_NAMES = array('j' => 'tracer',
                        'm' => 'jmnotrc',
                        'v8' => 'v8',
                        'jsc' => 'nitro',
                        'moom' => 'moom',
                        'mooj' => 'mooj');

    $lines = array();
    for ($i = 0; $i < count($modes); $i++) {
        $mode = $modes[$i];
        $lines[$mode] = '[';
        $counter = 0;
        for ($j = count($runIds) - 1; $j >= 0; $j--) {
            $runId = $runIds[$j];
            if (isset($stats[$runId][$test][$mode]))
                $amount = $stats[$runId][$test][$mode];
            else
                $amount = 'null';
            $lines[$mode] .= '[' . $counter . ',' .
                                 $amount .
                             ']';
            if ($j != 0)
                $lines[$mode] .= ',';
            $counter++;
        }
        $lines[$mode] .= ']';
    }

    $nlines = array();
    for ($i = 0; $i < count($modes); $i++) {
        $mode = $modes[$i];
        $nlines[] = array('name' => $MODE_NAMES[$mode],
                          'data' => $lines[$mode]);
    }

    return $nlines;
}

function Everything(&$smarty)
{
    global $MACHINE;

    $runs = FindRuns(70);

    /* Find runs that failed. */
    for ($i = 0; $i < count($runs); $i++) {
        $run = $runs[$i];
        if ($run['status'] != 1) {
            $smarty->assign('runError', $run);
            break;
        }
    }

    $runIds = array();
    $runTimes = array();
    for ($i = 0; $i < count($runs); $i++) {
        if ($runs[$i]['status'] != 1)
            continue;
        $runIds[] = $runs[$i]['id'];
        $runTimes[] = date("M j, Y", $runs[$i]['stamp']);
    }
    $runTimes = array_reverse($runTimes);
    if (count($runIds) == 0) {
        die("oh no what are you doing");
    }
    $idstr = implode(",", $runIds);

    $query = "SELECT run, name, time_ms, mode, suite
              FROM fast_test
              WHERE run IN ($idstr)";
    $result = mysql_query($query) or die("error: " . mysql_error());
    $suite_stats = array();
    while (($row = mysql_fetch_array($result)) !== FALSE) {
        $runId = $row['run'];
        $name = $row['suite'] . '-' . $row['name'];
        $time = $row['time_ms'];
        $mode = $row['mode'];
        if ($mode == '')
            $mode = 'i';
        if (!isset($suite_stats[$runId][$name][$mode]))
            $suite_stats[$runId][$name][$mode] = floatval($time);
        else
            $suite_stats[$runId][$name][$mode] += floatval($time);
    }

    $query = "SELECT run, name, cset FROM fast_engine
              WHERE run IN ($idstr)";
    $result = mysql_query($query) or die("error: " . mysql_error());
    $builds = array();
    while (($row = mysql_fetch_array($result)) !== FALSE) {
        $runId = $row['run'];
        $builds[$runId] = array('engine' => $row['name'], 'cset' => $row['cset']);
    }

    $MIDS = array(3 => array('j', 'v8'),
                  4 => array('j', 'v8', 'jsc', 'moom', 'mooj'),
                  5 => array('j', 'v8', 'jsc', 'moom', 'mooj'),
                  6 => array('j', 'moom', 'mooj', 'v8'),
                  7 => array('j', 'moom', 'mooj', 'v8')
                 );

    /* Build the line graph data sets. */
    global $TEST_LIST;
    $tests = array();
    for ($i = 0; $i < count($TEST_LIST); $i++) {
        $lines = BuildLines($suite_stats, $MIDS[$MACHINE], $runIds, $TEST_LIST[$i]);
        $tests[] = array('lines' => $lines, 'name' => $TEST_LIST[$i]);
    }
    $smarty->assign('tests', $tests);

    /* Now, in the same order, we want build information about each engine. */
    $query = "SELECT fr.id, fe.name, fe.cset
              FROM fast_engine fe
              JOIN fast_run fr
              ON fe.run = fr.id
              WHERE fr.id IN ($idstr)
              ORDER BY fr.id ASC";
    $query = mysql_query($query);
    if (!$query)
        die('error: ' . mysql_error());

    /* Prep the mapping of engine names and runs to builds. */
    $engines = array('jm', 'tm', 'v8', 'jsc', 'moo');
    $engineStrings = array();
    for ($i = 0; $i < count($engines); $i++)
        $engineStrings[$engines[$i]] = array();

    /* Map engine names and run IDs to builds. */
    while (($data = mysql_fetch_array($query)) !== FALSE)
        $engineStrings[$data[1]][$data[0]] = "'" . $data[2] . "'";

    /* Please agree with me that this is hideous. Why aren't I using Python. */
    $engineBuilds = array();
    for ($i = 0; $i < count($engines); $i++) {
        $engine = $engines[$i];
        $newvec = array();
        for ($j = count($runIds) - 1; $j >= 0; $j--) {
            $run = $runIds[$j];
            if (isset($engineStrings[$engine][$run])) {
                $newvec[] = $engineStrings[$engine][$run];
            } else {
                $newvec[] = "null";
            }
        }
        $engineBuilds[$engine] = implode(',', $newvec);
    }

    $smarty->assign('engineBuilds', $engineBuilds);
    $smarty->assign('runTimes', $runTimes);

    $EMAP = array('j' => 'tm',
                  'mj' => 'tm',
                  'v8' => 'v8',
                  'jsc' => 'jsc',
                  'moom' => 'tm',
                  'mooj' => 'tm');

    /* Give a mapping from seriesIndex to engine name. */
    $engineMapping = array();
    for ($i = 0; $i < count($MIDS[$MACHINE]); $i++) {
        $engineMapping[] = "'" . $EMAP[$MIDS[$MACHINE][$i]] . "'";
    }
    $engineMapping = '[' . implode(',', $engineMapping) . ']';
    $smarty->assign('engineMapping', $engineMapping);
}

function FindRuns($num)
{
    global $MACHINE;
    global $STOP_DATE;
    if ($STOP_DATE) {
        $query = "SELECT id, stamp, cset, status, error
                  FROM fast_run
                  WHERE machine = $MACHINE
                  AND stamp <= $STOP_DATE
                  ORDER BY stamp DESC
                  LIMIT $num";
    } else {
        $query = "SELECT id, stamp, cset, status, error
                  FROM fast_run
                  WHERE machine = $MACHINE
                  ORDER BY stamp DESC
                  LIMIT $num";
    }
    $result = mysql_query($query) or die("error");
    $runs = array();
    while (($row = mysql_fetch_array($result)) !== FALSE)
        $runs[] = $row;
    return $runs;
}

?>
