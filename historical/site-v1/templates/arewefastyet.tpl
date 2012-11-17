<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
 <meta http-equiv="content-type" content="text/html; charset=UTF-8">
 <meta http-equiv="content-language" content="en">
 <meta http-equiv="refresh" content="300">
 <title>ARE WE FAST YET?</title>
 <link rel="stylesheet" title="Default Stylesheet" type="text/css" href="style.css">
 <link rel="alternate" type="application/rss+xml" title="RSS feeds" href="rss.php">
 <link rel="shortcut icon" href="http://www.arewefastyet.com/awfy_favicon.png">
 <script type="text/javascript" src="flot/jquery.js"></script>
 <script type="text/javascript" src="flot/jquery.flot.js"></script>
</head>
<body>
 <div id="graph-container">
  <div id="sunspider-label">sunspider<span id="sunspider-speed"></span></div>
  <div id="v8-label">v8bench<span id="v8-speed"></span></div>
  <div id="sunspider-graph"></div>
  <div id="v8-graph"></div>
 </div>
 <ul class="engine-legend" id="legend1">
  <li id="moz-mooj">mozilla firefox 4 (TM+JM)</li>
  <li id="google-v8">google chrome (v8)</li>
 </ul>
 <ul class="engine-legend" id="legend2">
{if $MACHINE == 5 or $MACHINE == 4}
  <li id="apple-nitro">apple safari (nitro)</li>
{else}
  <li id="moz-moom">mozilla firefox (JM only)</li>
  <li id="tracing">mozilla firefox (TM only)</li>
{/if}
 </ul>
  <script type="text/javascript">
  {literal}
  var fullNames = {
  	jm: 'tracemonkey',
	tm: 'tracemonkey',
	v8: 'v8',
	jsc: 'WebKit',
	jsci: 'WebKit',
	moo: 'tracemonkey',
  };
  function calcPercentDiff(currentValue, previousValue) {
    return -Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10;
  }
  function getLowestNitroV8SetNumber(dsets) {
    var nitroSetNumber = -1;
    var v8SetNumber = -1;
    for (var i = 0; i < dsets.length; i++) {
      if (dsets[i].name == "nitro") {
        nitroSetNumber = i;
      } else if (dsets[i].name == "v8") {
        v8SetNumber = i;
      }
    }
    if ((nitroSetNumber > -1) && (dsets[nitroSetNumber].data[dsets[nitroSetNumber,1].data.length - 1][1] < dsets[v8SetNumber].data[dsets[v8SetNumber,1].data.length - 1][1])) {
      return nitroSetNumber;
    } else {
      return v8SetNumber;
    }
  }
  function getTitlePercentDiff(dsets) {
    var dataLength = dsets[3].data.length -1;                   //ID for last Jaeger dataset
    var lastJaeger = dsets[3].data[dataLength][1];              //last speed data point for Jaeger
    var target = dsets[getLowestNitroV8SetNumber(dsets)].data[dataLength][1];   //set Target to the lowest last value of V8 and Nitro
    var percentDiff = calcPercentDiff(lastJaeger,target);       //get the percent diff between Jaeger and the Target
    if (percentDiff > 10) percentDiff = Math.round(percentDiff);//if the percent diff is above 10, round to eliminate 10ths
    var direction = "slower";                                   //set speed direction Slower/Faster from Jaeger value compared to Target
    if (lastJaeger < target) direction = "FASTER!";
    var titlePercent = ' is ' + percentDiff +'% ' + direction;
    return titlePercent;
  }
  function colorForName(name) {
    return ({ nitro: "#cf4b4b",
              interp: "#bbbbbb",
              v8: "#4da74d",
              jaeger: "#6f0a93",
{/literal}
{if $MACHINE == 4 || $MACHINE == 5}
              tracer: "#6f0a93",
{else}
              tracer: "#ffa451",
{/if}
{literal}
	      jsci: "#EF8B8B",
	      mooi: "#027364",
	      moom: "#000000",
	      mooj: "#6f0a93",
              jmnotrc: "#3e99d7"})[name];
  }
  function fillColorForName(name) {
    return "#ffffff";
  }
  function drawGraph(sel, dsets) {
    var sets = [];
    var jaegerSetNumber = 3;
    for (var i = 0; i < dsets.length; i++) {
        var dataRadius = 2.0;
        if (dsets[i].name == "jaeger") {
            jaegerSetNumber = i;
        }
        sets[i] = {
                   lines: { show: true },
                   points: { show: true,
                             fillColor: fillColorForName(dsets[i].name),
                           },
                   borderWidth: 1.5,
                   borderColor: "#BEBEBE",
                   markingsLineWidth: .75,
                   hoverable: true,
                   clickable: true,
                   label: dsets[i].name,
                   data: dsets[i].data,
                   color: colorForName(dsets[i].name),
                   shadowSize: 0
                 };
    }
    var options = { yaxis: {
                        min: 0,
                        tickFormatter:
                            function (v, axis) { return v + "ms"; }
                    },
                    xaxis: {
                        tickFormatter:
                            function (v, axis) {
                                v = Math.round(v);
                                if (!(v in runTimes))
                                    return '';
                                return runTimes[v].substr(0, runTimes[v].indexOf(','));
                            }
                    },
                    legend:
                    {
                        show: false
                    },
                    grid:
                    {
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
        var iebody = (document.compatMode == "CSS1Compat")
                     ? document.documentElement
                     : document.body;
        var scrollLeft = ie ? iebody.scrollLeft : window.pageXOffset;
        var scrollTop = ie ? iebody.scrollTop : window.pageYOffset;
        var docWidth = ie ? iebody.clientWidth - 15 : window.innerWidth - 15;
        var docHeight = ie ? iebody.clientHeight - 15 : window.innerHeight - 18;
        y = (y + tipHeight - scrollTop > docHeight)
            ? y - tipHeight - 5 - (yOffset * 2)
            : y; // account for bottom edge
        
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
    var previousPoint = null;
    $.plot(sel, sets, options);
    sel.bind("plothover", function (event, pos, item) {
        if (item) {
            if (!previousPoint ||
                (previousPoint[0] != item.datapoint[0]) ||
                (previousPoint[1] != item.datapoint[1])) {
                previousPoint = item.datapoint;
                $("#tooltip").remove();
                var x = item.datapoint[0];
                var y = item.datapoint[1];
                var e = engineNames[item.seriesIndex];
                var text = 'speed: ' + y + "ms" + "<br>";
                if (x > 0) {
                    var thisValue = parseFloat(y);
                    var prevValue = parseFloat(item.series.data[x-1,x-1][1]);
                    var speedDiff = Math.round((thisValue - prevValue)*10)/10;
                    var pdiff = calcPercentDiff(thisValue, prevValue);
                    var fbofw;
                    if (pdiff < 0) {
                        fbofw = "worse";
                        pdiff = -pdiff;
                    } else {
                        fbofw = "better";
                    }
                    if (speedDiff === speedDiff) {
                    text += String.fromCharCode(916) + ": " + speedDiff + 'ms (' +
                            pdiff + "% " + fbofw + ")<br>";
                    }
                }
                var fullName = fullNames[e];
                text += "source: " + fullName + "<br>";
                text += "rev: ";
                var cset = engineBuilds[e][x];
                if (cset) {
                    if (fullName == "tracemonkey") {
                        text += "<a href=\"http://hg.mozilla.org/tracemonkey/rev/" + cset +
                                "\">" + cset + "</a>";
                    } else if (fullName == "v8") {
                        text += "<a href=\"http://code.google.com/p/v8/source/detail?r=" + cset +
                                "\">" + cset + "</a>";
                    } else if (fullName == "WebKit") {
                        text += "<a href=\"http://trac.webkit.org/changeset/" + cset +
                                "\">" + cset + "</a>";
                    } else {
                        text += cset;
                    }
                } else {
                    text += 'unknown';
                }
                text += "<br>";
                var buildTime = runTimes[x];
                text += "tested: " + buildTime;
                showToolTip(item.pageX, item.pageY, text);
            }
        } else {
            $("#tooltip").remove();
            previousPoint = null;
        }
    });
  }
  var runTimes = [
    {/literal}
    {foreach from=$runTimes item=v name=runtimes}
      '{$v}'{if !$smarty.foreach.runtimes.last},{/if}
    {/foreach}
    {literal}
  ];
  var engineBuilds = {
    {/literal}
    {foreach from=$engineBuilds key=k item=v name=emap}
      {$k}: [ {$v} ]{if !$smarty.foreach.emap.last},{/if}

    {/foreach}
    {literal}
  };
  var engineNames = {/literal}{$engineMapping}{literal};
  function drawSelfSS() {
    var dsets = [
      {/literal}
      {foreach from=$self_ss item=set}
        {literal}{{/literal}
        name: "{$set.name}",
        data: {$set.data}
        {literal}}{/literal},
      {/foreach}
      {literal}
    ];
    drawGraph($("#sunspider-graph"), dsets);
    //document.getElementById('sunspider-speed').innerHTML = getTitlePercentDiff(dsets);
  }
  function drawSelfV8() {
    var dsets = [
      {/literal}
      {foreach from=$self_v8 item=set}
        {literal}{{/literal}
        name: "{$set.name}",
        data: {$set.data}
        {literal}}{/literal},
      {/foreach}
      {literal}
    ];
    drawGraph($("#v8-graph"), dsets);
    //document.getElementById('v8-speed').innerHTML = getTitlePercentDiff(dsets);
  }
  $(document).ready(function () {
     drawSelfSS();
     drawSelfV8();
  });
  {/literal}
  </script>
 <ul id="links">
  <li><a href="?machine=5">x86</a></li>
  <li><a href="?machine=4">x64</a></li>
  <!-- <li><a href="?machine=3">ARM</a></li> -->
  <li><a href="?machine=6">regress-x86</a></li>
  <li><a href="?machine=7">regress-x64</a></li>
  <li><a href="faq.html">FAQ</a></li>
  <li><a href="awfy2.php?machine=9">beta awfy2</a></li>
  <li><a href="mailto:danderson@mozilla.com">suggestions</a></li>
 </ul>
</body>
</html>

