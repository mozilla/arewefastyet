<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
 <meta http-equiv="content-type" content="text/html; charset=UTF-8">
 <meta http-equiv="content-language" content="en">
 <meta http-equiv="refresh" content="300">
 <title>ARE WE FAST YET?</title>
 <link rel="stylesheet" title="Default Stylesheet" type="text/css" href="style2.css">
 <link rel="stylesheet" title="Default Stylesheet" type="text/css" href="navbar.css">
 <link rel="alternate" type="application/rss+xml" title="RSS feeds" href="rss.php">
 <link rel="shortcut icon" href="http://www.arewefastyet.com/awfy_favicon.png">
 <script type="text/javascript" src="flot/jquery.js"></script>
 <script type="text/javascript" src="flot/jquery.flot.js"></script>
 <script type="text/javascript" src="navbar.js"></script>
</head>
<body>
 <div class="graph-container">
  <div id="kraken-label">kraken time</div>
  <div id="sunspider-label">sunspider time</div>
  <div id="kraken-graph"></div>
  <div id="sunspider-graph"></div>
 </div>
 <br>
 <div style="clear: both;">
  <span id="main-navbar-container">
   {include file="legend.tpl"}
   <br/>
   {include file="navbar.tpl"}
  </span>
  <div class="graph-container">
   <div id="v8-label">v8bench score</div>
   <div id="v8-graph"></div>
  </div>
 </span>
 <br>
  <script type="text/javascript">
{literal}
function AWFY() {
    var Vendors = [{/literal}
    {foreach from=$cx->vendors item=v}
    {literal}{{/literal}
            name: "{$v.name}",
            vendor: "{$v.vendor}",
            csetURL: "{$v.csetURL}",
            browser: "{$v.browser}"
        {literal}}{/literal},
    {/foreach}{literal}
    ];

    var Modes = [{/literal}
    {foreach from=$cx->modes item=v}
    {literal}{{/literal}
            vendor: {$v.vendor},
            mode: "{$v.mode}",
            name: "{$v.name}",
            color: "{$v.color}"
        {literal}}{/literal},
    {/foreach}{literal}
    ];

    var Graphs = {{/literal}
    {foreach from=$graphs key=k item=v name=graphmap}
        {$k}: {literal}{{/literal}
        description: "{$v.description}",
        direction: {$v.direction},
        runs: [
        {foreach from=$v.graph->runs key=gk item=gv name=runs}
            {literal}{{/literal}
                fullDate: "{$gv.stamp|date_format:"%b %e, %Y %H:%M"}",
                shortDate: "{$gv.stamp|date_format:"%b %e"}"
            {literal}}{/literal}
            {if !$smarty.foreach.runs.last},{/if}
        {/foreach}
        ],
        displays: [
        {foreach from=$v.graph->series key=sk item=sv name=series}
            {literal}{
                lines: { show: true },
                points: { show: true,
                          fillColor: "#ffffff"
                        },
                borderWidth: 1.5,
                borderColor: "#BEBEBE",
                markingsLineWidth: .75,
                hoverable: true,
                clickable: true,
                shadowSize: 0,
                {/literal}
                color: Modes[{$sv.mode}].color,
                data: [
                {foreach from=$v.graph->runs key=gk item=gv name=runs}
                    [{$gk}, {if $sv.scores[$gk]}{$sv.scores[$gk]}{else}null{/if}]
                    {if !$smarty.foreach.runs.last},{/if}
                {/foreach}
                ]
            {literal}}{/literal}
            {if !$smarty.foreach.series.last},{/if}
        {/foreach}
        ],
        series: [
        {foreach from=$v.graph->series key=sk item=sv name=series}
            {literal}{{/literal}
                mode: {$sv.mode},
                builds: [
                {foreach from=$v.graph->runs key=gk item=gv name=runs}
                    {if $sv.csets[$gk]}"{$sv.csets[$gk]}"{else}null{/if}
                    {if !$smarty.foreach.runs.last},{/if}
                {/foreach}
                ],
            {literal}}{/literal}
            {if !$smarty.foreach.series.last},{/if}
        {/foreach}
        ]
        {literal}}{/literal}
        {if !$smarty.foreach.graphmap.last},{/if}
    {/foreach}{literal}
    };

    function calcPercentDiff(currentValue, previousValue) {
        return -Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10;
    }

    var previousPoint = null;

    function drawGraph(elt, graph) {
        var options = {
            yaxis: {
                min: 0,
                tickFormatter: function (v, axis) {
                    if (graph.direction == -1)
                        return v + "ms";
                    return v;
                },
                invert: graph.direction == 1
            },
            xaxis: {
                tickFormatter: function (v, axis) {
                    v = Math.round(v);
                    if (!(v in graph.runs))
                        return '';
                    return graph.runs[v].shortDate;
                }
            },
            legend: { show: false },
            grid: {
                hoverable: true,
                clickable: true
            }
        };

        function showToolTip(x, y, contents) {
            var tipWidth = 165;
            var tipHeight = 75;
            var xOffset = 5;
            var yOffset = 5;
            var ie = document.all && !window.opera;
            var iebody = (document.compatMode == "CSS1Com[at")
                         ? document.documentElement
                         : document.body;
            var scrollLeft = ie ? iebody.scrollLeft : window.pageXOffset;
            var scrollTop = ie ? iebody.scrollTop : window.pageYOffset;
            var docWidth = ie ? iebody.clientWidth - 15 : window.innerWidth - 15;
            var docHeight = ie ? iebody.clientHeight - 15 : window.innerHeight - 8;
            y = (y + tipHeight - scrollTop > docHeight)
                ? y - tipHeight - 5 - (yOffset * 2)
                : y // account for bottom edge;
            
            // account for right edge
            if (x + tipWidth - scrollLeft > docWidth) {
                $('<div id="tooltip">' + contents + '<\/div>').css( {
                    top: y + yOffset,
                    right: docWidth - x + xOffset,
                }).appendTo("body").fadeIn(200);
            } else {
                $('<div id="tooltip">' + contents + '<\/div>').css( {
                    top: y + yOffset,
                    left: x + xOffset,
                }).appendTo("body").fadeIn(200);
            }
        }

        $.plot(elt, graph.displays, options);
        elt.bind("plothover", function (event, pos, item) {
            if (!item) {
                $("#tooltip").remove();
                previousPoint = null;
                return;
            }

            if (previousPoint &&
                (previousPoint[0] == item.datapoint[0]) &&
                (previousPoint[1] == item.datapoint[1])) {
                return;
            }

            previousPoint = item.datapoint;
            $("#tooltip").remove();
            var x = item.datapoint[0];
            var y = item.datapoint[1];
            var text = 'score: ' + y;

            if (graph.direction == -1)
                text += "ms";
            text += "<br>";
            
            if (x > 0) {
                var thisValue = parseFloat(y);
                var prevValue = parseFloat(item.series.data[x - 1, x - 1][1]);
                var diff = Math.round((thisValue - prevValue) * 10) / 10;
                var pdiff = calcPercentDiff(thisValue, prevValue);
                var better;
                if ((pdiff < 0 && graph.direction == -1) ||
                    (pdiff > 0 && graph.direction == 1)) {
                    better = "worse";
                } else {
                    better = "better";
                }
                pdiff = Math.abs(pdiff);
                if (diff === diff) {
                    text += String.fromCharCode(916) + ": " + diff;
                    if (graph.direction == -1)
                        text += "ms";
                    text += " (" + pdiff + "% " + better + ")<br>";
                }
            }

            var series = graph.series[item.seriesIndex];
            var mode = Modes[series.mode];
            var vendor = Vendors[mode.vendor];

            text += "source: " + vendor.vendor;
            if (vendor.name != mode.name)
                text += " (" + mode.name + ")";
            text += "<br>";
            text += "rev: <a href=\"" + vendor.csetURL + series.builds[x] + "\">" +
                    series.builds[x] + "</a><br>";
            text += "tested: " + graph.runs[x].fullDate;
            showToolTip(item.pageX, item.pageY, text);
        });
    }

    $(document).ready(function () {
        drawGraph($("#kraken-graph"), Graphs.kraken);
        drawGraph($("#sunspider-graph"), Graphs.ss);
        drawGraph($("#v8-graph"), Graphs.v8real);
        NavBar('navbar');
    });
}
AWFY();
{/literal}
  </script>
</body>
</html>

