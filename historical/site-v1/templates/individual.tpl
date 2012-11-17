<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
 <meta http-equiv="content-type" content="text/html; charset=UTF-8">
 <meta http-equiv="content-language" content="en">
 <title>ARE WE FAST YET?</title>
 <link rel="stylesheet" title="Default Stylesheet" type="text/css" href="style-indiv.css">
 <link rel="alternate" type="application/rss+xml" title="RSS feeds" href="rss.php">
 <link rel="shortcut icon" href="http://www.arewefastyet.com/awfy_favicon.png">
 <script type="text/javascript" src="MochiKit/MochiKit.js"></script>
 <script type="text/javascript" src="flot/jquery.js"></script>
 <script type="text/javascript" src="flot/jquery.flot.js"></script>
</head>
<body>
 <ul class="engine-legend" id="legend1">
  <li id="tracing">moz tracing JIT</li>
{if $MACHINE >= 6}
  <li id="jaeger-and-tracing">moz method+tracing</li>
{else}
  <li id="google-v8">google v8</li>
 {if $MACHINE != 3}
  <li id="apple-nitro">apple nitro</li>
 {/if}
{/if}
 </ul>
{if $MACHINE >= 4}
 <ul class="engine-legend" id="legend2">
  <li id="moz-moom">moz method JIT</li>
{if $MACHINE >= 6}
  <li id="google-v8">google v8</li>
{/if}
 </ul>
{/if}
 {foreach from=$tests item=test}
  <div class="graph-label">{$test.name}</div>
  <div class="graph" id="graph-{$test.name}"></div>
  <p>&nbsp;</p>
 {/foreach}
  <script type="text/javascript">
  {literal}
  var fullNames = {
  	jm: 'jaegermonkey',
	tm: 'tracemonkey',
	v8: 'v8',
	jsc: 'WebKit',
	jsci: 'WebKit',
	moo: 'jm-fatvals'
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
              tracer: "#ffa451",
              jsci: "#EF8B8B",
              mooi: "#027364",
	      mooj: "#6f0a93",
              moom: "#000000",
              jmnotrc: "#3e99d7"})[name];
  }
  function fillColorForName(name) {
    return "#ffffff";
  }
  function drawGraph(sel, dsets) {
      var sets = [];
      var jaegerSetNumber = 3;
      for (var i = 0; i < dsets.length; i++) {
          var dataRadius = 1.8;
          if (dsets[i].name == "jaeger") {
              jaegerSetNumber = i;
          }
          sets[i] = {
                     lines: { show: true },
                     points: { show: true,
                               fillColor: fillColorForName(dsets[i].name),
			       radius: dataRadius
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
                      legend: {
                         show: false
                      },
                      grid: {
                         hoverable: true,
                         clickable: true
                      }
      };
      function showToolTip(x, y, contents) {
          $('<div id="tooltip">' + contents + '<\/div>').css( {
              top: y + 5,
              left: x + 5,
          }).appendTo("body").fadeIn(200);
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
                      text += String.fromCharCode(916) + ": " + speedDiff + 'ms (' +
                              pdiff + "% " + fbofw + ")<br>";
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
  var engineNames = {/literal}{ $engineMapping }{literal};
  function drawAllGraphs() {
    var dsets;

    {/literal}
    {foreach from=$tests item=test}
    dsets = [
      {foreach from=$test.lines item=line}
        {literal}{{/literal}
        name: "{$line.name}",
        data: {$line.data}
        {literal}}{/literal},
      {/foreach}
    ];
    drawGraph($("#graph-{$test.name}"), dsets);
    {/foreach}
    {literal}
  }
  MochiKit.DOM.addLoadEvent(drawAllGraphs);
  {/literal}
  </script>
 <ul id="links">
  <li><a href="?machine=5">x86 graphs</a></li>
  <li><a href="?machine=4">x64 graphs</a></li>
  <li><a href="?machine=3">ARM graphs</a></li>
  <li><a href="faq.html">FAQ</a></li>
  <li><a href="mailto:danderson@mozilla.com">suggestions</a></li>
 </ul>
</body>
</html>

