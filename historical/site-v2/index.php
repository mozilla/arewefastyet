<?php
date_default_timezone_set("UTC");
// vim: set ts=4 sw=4 tw=99 et:

require_once("internals.php");
require_once("context.php");

init_database();

$smarty = new_smarty();
$cx = new Context();
$view = isset($_GET['view']) ? $_GET['view'] : 'normal';

if ($cx->view == 'breakdown') {
    $graphs = makeIndividualGraphs($cx, array(1, 3, 4));
    $tpl = "takethree-individual";
} else {
    $graphs = makeTotalGraphs($cx, array(1, 3, 4));
    $tpl = "takethree";
}

$machines = array(array('id' => 9,
                        'info' => 'Mac OS X, 32-bit (Mac Mini)'),
                  array('id' => 8,
                        'info' => 'Mac OS X, 64-bit (Mac Mini)'),
                  array('id' => 10,
                        'info' => 'Linux ARMv7 (nVidia Tegra 250)'));
$smarty->assign('machines', $machines);
$smarty->assign('machine_id', $cx->machine_id);
$smarty->assign('url_machine', $cx->url(array('machine' => false)));

$views = array(array('id' => 'overall',
	                 'name' => 'Overall'),
               array('id' => 'regress',
                     'name' => 'Regression Testing'),
               array('id' => 'breakdown',
                     'name' => 'Test Breakdown'));
$smarty->assign('views', $views);
$smarty->assign('view', $cx->view);
$smarty->assign('url_view', $cx->url(array('view' => false)));

$smarty->assign('cx', $cx);
$smarty->assign('graphs', $graphs);

$smarty->display("$tpl.tpl");

function makeIndividualGraphs(&$cx, $list)
{
    $graphs = array();

    for ($i = 0; $i < count($list); $i++) {
        $suite_id = $list[$i];
        $query = "SELECT name, description, better_direction
                  FROM awfy_suite
                  WHERE id = $suite_id";
        $result = awfy_query($query);
        if (!mysql_num_rows($result))
            continue;
        $row = mysql_fetch_assoc($result);
        $suite_name = $row['name'];
        $suite_desc = $row['description'];
        $suite_direction = $row['better_direction'];

        $filter = RunFilter::FromGET($cx, $suite_id);

        $query = "SELECT test
                  FROM awfy_breakdown b
                  WHERE run_id IN (" . $filter->idstr . ") 
                  AND suite_id = $suite_id
                  GROUP BY test";
        $result = awfy_query($query);
        while (($row = mysql_fetch_assoc($result)) !== FALSE) {
            $test_name = $row['test'];
            $gb = new GraphBuilder($cx, $filter, $test_name);
            $graphs[$suite_name . "-" . $test_name] = array(
                'description' => $suite_name . "-" . $test_name,
                'direction' => $suite_direction,
                'graph' => $gb
            );
        }
    }

    return $graphs;
}

function makeTotalGraphs(&$cx, $list)
{
    $graphs = array();

    for ($i = 0; $i < count($list); $i++) {
        $id = $list[$i];
        $query = "SELECT name, description, better_direction
                  FROM awfy_suite
                  WHERE id = $id";
        $result = awfy_query($query);
        if (!mysql_num_rows($result))
            continue;
        $row = mysql_fetch_assoc($result);
        $filter = RunFilter::FromGET($cx, $id);
        $gb = new GraphBuilder($cx, $filter);
        $graphs[$row['name']] = array(
            'description' => $row['description'],
            'direction' => $row['better_direction'],
            'graph' => $gb
        );
    }

    return $graphs;
}

