<?php
/* vim: set ts=4 sw=4 tw=99 et: */

require_once("internals.php");

init_database();

global $MACHINE;

$smarty = new_smarty();

Everything($smarty);

$smarty->display('rss.tpl');

function Everything(&$smarty)
{
    $runs = FindRuns(20);

    for ($i = 0; $i < count($runs); $i++) {
        $runs[$i]['date'] = date("M j, Y H:i", $runs[$i]['stamp']);
    }

    $smarty->assign('runs', $runs);
}

function FindRuns($num)
{
    global $MACHINE;
    $query = "SELECT id, stamp, cset, status, error, machine, cpu, os
              FROM fast_run
              ORDER BY stamp DESC
              LIMIT $num";
    $result = mysql_query($query) or die("error");
    $runs = array();
    while (($row = mysql_fetch_array($result)) !== FALSE)
        $runs[] = $row;
    return $runs;
}

?>
