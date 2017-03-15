// vim: set ts=4 sw=4 tw=99 et:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";
var AWFY = { };

AWFY.DEFAULT_MACHINE_ID = 29;
AWFY.refreshTime = 60 * 5;
AWFY.machineId = 0;
AWFY.hasLegend = false;
AWFY.panes = [];
AWFY.queryParams = null;
AWFY.aggregate = null;
AWFY.xhr = [];
AWFY.view = 'none';
AWFY.suiteName = null;
AWFY.subtest = null;
AWFY.lastHash = null;
AWFY.lastRefresh = 0;

// Hide a view modes by default. Since they aren't active anymore
AWFYMaster.modes["35"].hidden = true
AWFYMaster.modes["36"].hidden = true
AWFYMaster.modes["40"].hidden = true
AWFYMaster.modes["42"].hidden = true
AWFYMaster.modes["54"].hidden = true
AWFYMaster.modes["56"].hidden = true
AWFYMaster.modes["27"].hidden = true
AWFYMaster.modes["29"].hidden = true
AWFYMaster.modes["22"].hidden = true

AWFY.request = function (files, callback) {
    var url = window.location.protocol + '//' +
              window.location.host;
    if (url[url.length - 1] != '/')
        url += '/';
    url += 'data.php?file=';

    var count = 0;
    var received = new Array(files.length);
    var done = (function (jqXHR, textStatus) {
        count++;
        if (count == files.length)
            callback(received);
        this.xhr.splice(this.xhr.lastIndexOf(jqXHR), 1);
    }).bind(this);

    for (var i = 0; i < files.length; i++) {
        var success = (function (index) {
            return function (data, textStatus, jqXHR) {
                received[index] = data;
            };
        })(i);
        var req = { async: true,
                    complete: done,
                    success: success,
                    cache: false
                  };
        this.xhr.push($.ajax(url + files[i] + '.json', req));
    }
}

AWFY.pushState = function () {
    // Build URL query.
    var vars = []
    vars.push('machine=' + encodeURIComponent(this.machineId));

    if (this.view == 'breakdown') {
        vars.push('view=breakdown');
        vars.push('suite=' + encodeURIComponent(this.suiteName));
    }
    if (this.view == 'single') {
        vars.push('view=single');
        vars.push('suite=' + encodeURIComponent(this.suiteName));
        if (this.subtest)
            vars.push('subtest=' + encodeURIComponent(this.subtest));
        if (this.start && this.end) {
            vars.push('start='+encodeURIComponent(this.start));
            vars.push('end='+encodeURIComponent(this.end));
        }
    }

    if ($('#about').is(':visible'))
        vars.push('about=1');

    var text = '#' + vars.join('&');
    this.lastHash = text;
    if (window.history.pushState)
        window.history.pushState(null, 'AreWeFastYet', text);
    else
        window.location.hash = '#' + text;
}

AWFY.loadAggregateGraph = function (blobgraph) {
    if (!blobgraph)
        return;
    var lines = [];
    var info = [];
    for (var i = 0; i < blobgraph.lines.length; i++) {
        var blobline = blobgraph.lines[i];

        var points = [];
        var k = 0;
        for (var j = 0; j < blobline.data.length; j++) {
            var point = blobline.data[j];
            // When there is no point, we normally just push a null point.
            // This results in a line stop. Now e.g. firefox OS has 4 different
            // engines reporting on different times. So every point has a gap.
            // To counteract this we still draw a line (by not giving null points),
            // if there has been less than the amount of lines (*1.5).
            if (!point) {
                if (k++ < blobgraph.lines.length*1.5)
                    continue
            } else {
                k = 0;
            }
            var score = point && point[0]
                        ? point[0]
                        : null;
            points.push([j, score]);
        }

        var mode = AWFYMaster.modes[blobline.modeid];
        if (!mode)
            continue;

        var line = { color: mode.color, data: points };
        lines.push(line);
        info.push(blobline);
    }

    var graph = { lines: lines,
                  direction: blobgraph.direction,
                  aggregate: blobgraph.aggregate,
                  timelist: blobgraph.timelist,
                  earliest: blobgraph.earliest,
                  info: info
                };
    return graph;
}

AWFY.displayNewGraph = function (prefix, id, domid, graph) {
    var elt = $('#' + domid + '-graph');
    var title = $('#' + domid + '-title');
    if (!elt.length)
        return;
    if (!graph) {
        this.aggregate[id] = undefined;
        elt.hide();
        title.hide();
        return;
    }
    elt.show();
    title.show();
    var display = elt.data('awfy-display');
    if (!display) {
        display = new Display(this, prefix, id, domid, elt);
        elt.data('awfy-display', display);
    }
    if (display.shouldRefresh()) {
        display.setup(graph);
        display.draw();
    }
    this.aggregate[id] = graph;
    if (this.start && this.end) {
        AWFY.requestZoom(display, "condensed", this.start, this.end)
        display.zoomInfo.level = 'month';
    }
}

AWFY.drawLegend = function () {
    // Draw the legend if needed.
    if (this.hasLegend)
        return;

    var legend = $("#legend");

    legend.empty();

    var modes = [];
    for (var modename in AWFYMaster.modes) {
        var mode = AWFYMaster.modes[modename];
        // hack - strip jm+ti, bc
        if (modename == 12 || modename == 15)
            continue;
        if (AWFY.machineId != 14 && modename == 16)
            continue;
        if (!mode.used)
            continue;
        modes.push(mode);
    }
    modes.sort(function(a,b) {return a.vendor_id + a.name < b.vendor_id + b.name});

    var oneHidden = false;
    for (var i = 0; i < modes.length; i++) {
        var mode = modes[i];
        var vendor = AWFYMaster.vendors[mode.vendor_id];
        if (!vendor)
            continue;
        var item = $('<li style="border-color:' + mode.color + '"></li>');
        var link = $('<a href="#" style="text-decoration: none">' +
                     vendor.browser +
                     ' (' +
                     mode.name +
                     ')</a>');

        var onClick = (function (awfy, mode, link) {
            return (function () {
                if (mode.runtime_hidden) {
                    mode.runtime_hidden = false;
                    link.css('color', '#000000');
                } else {
                    mode.runtime_hidden = true;
                    link.css('color', '#cccccc');
                }
                for (var i = 0; i < this.panes.length; i++) {
                    var elt = this.panes[i];
                    var display = elt.data('awfy-display');
                    if (!display)
                        continue;
                    display.draw();
                }
                return false;
            }).bind(awfy);
        })(this, mode, link);
        link.click(onClick);

        if (mode.hidden) {
            oneHidden = true;
            link.addClass('inactive');
        } else {
            link.removeClass('inactive');
		}
		if (mode.runtime_hidden) 
			link.css('color', '#cccccc');

        link.appendTo(item);
        item.appendTo(legend);
    }

	var view = $("<div><a href='#' class='show'>[Show obsolete modes]</a><a href='#' class='hide'>[Hide obsolete modes]</a></div>");
	view.click(function() {
		legend.toggleClass("all");
		return false;
	});
	legend.append(view);

    this.hasLegend = true;
}

AWFY.computeBreakdown = function (data, prefix, id, domid) {
    var blob = typeof data == "string"
               ? JSON.parse(data)
               : data;

    // Should we handle version changes better?
    if (blob.version != AWFYMaster.version) {
        window.location.reload();
        return;
    }

    var graph = this.loadAggregateGraph(blob['graph']);
    this.displayNewGraph(prefix, id, domid, graph);
}

AWFY.computeAggregate = function (received) {
    var blob = typeof received[0] == "string"
               ? JSON.parse(received[0])
               : received[0];

    // Should we handle version changes better?
    if (blob.version != AWFYMaster.version) {
        window.location.reload();
        return;
    }

    var graphs = { };
    for (var name in blob.graphs) {
        var blobgraph = blob.graphs[name];
        if (!blobgraph)
            continue;
        graphs[name] = this.loadAggregateGraph(blobgraph);
    }

    // Save this for if/when we need to zoom out.
    this.aggregate = graphs;

    for (var id in graphs) {
        this.displayNewGraph("", id, id, graphs[id]);
    }

    this.drawLegend();
}

AWFY.mergeJSON = function (blobs) {
    var lines = { };
    var timelist = [];

    // We're guaranteed the blobs are in sorted order, which makes this simpler.
    for (var i = 0; i < blobs.length; i++) {
        var blob = blobs[i];

        // Should we handle version changes better?
        if (blob.version != AWFYMaster.version) {
            window.location.reload();
            return;
        }

        for (var j = 0; j < blob.graph.lines.length; j++) {
            var blobline = blob.graph.lines[j];

            var line = lines[blobline.modeid];
            if (!line) {
                var points = [];
                var info = [];

                // We have to pre-fill the array with slots for each blob
                // we may have missed.
                for (var k = 0; k < timelist.length; k++) {
                    points.push(null);
                    info.push(null);
                }

                line = { points: points, info: info };
                lines[blobline.modeid] = line;
            }

            var points = line.points;
            var info = line.info;

            for (var k = 0; k < blobline.data.length; k++) {
                var point = blobline.data[k];
                var score = point && point[0]
                            ? point[0]
                            : null;
                points.push([timelist.length + k, score]);
                info.push(point);
            }
        }

        for (var j = 0; j < blob.graph.timelist.length; j++)
            timelist.push(blob.graph.timelist[j]);

        // If we missed updating any line, pre-fill it with null points.
        for (var modeid in lines) {
            var line = lines[modeid];
            if (line.points.length == timelist.length)
                continue;
            for (var j = line.points.length; j < timelist.length; j++) {
                line.points.push(null);
                line.info.push(null);
            }
        }
    }

    var actual = [];
    var info = [];
    for (var modename in lines) {
        if (!(modename in AWFYMaster.modes))
            continue;
        var line = { data: lines[modename].points,
                     color: AWFYMaster.modes[modename].color
                   };
        actual.push(line);
        info.push({ 'modeid': parseInt(modename),
                    'data': lines[modename].info });
    }

    var graph = { lines: actual,
                  aggregate: false,
                  timelist: timelist,
                  info: info
                };
    return graph;
}

AWFY.condense = function (graph, max) {
    if (graph.timelist.length <= max)
        return graph;

    var slice = graph.timelist.length / max;

    var timelist = [];
    var lines = [];
    var info = [];

    // Setup the new structures.
    for (var i = 0; i < graph.lines.length; i++) {
        var newline = { 'color': graph.lines[i].color,
                        'data': []
                      };
        var newinfo = { 'modeid': graph.info[i].modeid,
                        'data': []
                      };
        lines.push(newline);
        info.push(newinfo);
    }

    var pos = 0;
    for (var i = 0; i < max; i++) {
        var start = Math.round(pos);

        for (var lineno = 0; lineno < lines.length; lineno++) {
            var oldinfo = graph.info[lineno];
            var newline = lines[lineno];
            var newinfo = info[lineno];

            var average = 0;
            var count = 0;
            var first = null;
            var last = null;
            var suite_version = null
            var id = null
            for (var j = start; j < pos + slice && j < oldinfo.data.length; j++) {
                var point = oldinfo.data[j];
                if (!point || !point[0])
                    continue;
                if (!first)
                    first = point[1];
                if (point.length > 1 && point[2])
                    last = point[2];
                else
                    last = first
                average = ((average * count) + point[0]) / (count + 1);
                suite_version = point[3]
                id = point[4]
                count += 1;
            }

            var score = average ? average : null;
            id = count == 1 ? id : null
            newline.data.push([timelist.length, score]);
			newinfo.data.push([average, first, last, suite_version, id])
        }

        timelist.push(graph.timelist[start]);
        pos += slice;
    }

    return { info: info,
             lines: lines,
             timelist: timelist,
             direction: graph.direction };
}

AWFY.trim = function (graph, start, end) {
    var timelist = [];
    var lines = [];
    var infos = [];

    // Setup the new structures.
    for (var i = 0; i < graph.lines.length; i++) {
        var newline = { 'color': graph.lines[i].color,
                        'data': []
                      };
        var newinfo = { 'modeid': graph.info[i].modeid,
                        'data': []
                      };
        lines.push(newline);
        infos.push(newinfo);
    }

    // Whether |end| is inclusive is not really clear, actually.
    for (var i = start; i < end; i++)
        timelist.push(graph.timelist[i]);

    for (var i = 0; i < graph.lines.length; i++) {
        var oldline = graph.lines[i];
        var oldinfo = graph.info[i];
        var line = lines[i];
        var info = infos[i];
        for (var j = start; j < end; j++) {
            var point = oldline.data[j];
            line.data.push([j - start, point ? point[1] : null]);
            info.data.push(oldinfo.data[j]);
        }
    }

    return { lines: lines,
             info: infos,
             timelist: timelist,
             direction: graph.direction,
             start: start,
             end: end
           };
}

AWFY.computeZoom = function (display, received, start, end) {
    // Get JSON blobs for each received text.
    var blobs = [];
    for (var i = 0; i < received.length; i++) {
        if (!received[i])
            continue;
        if (typeof received[i] == "string")
            blobs.push(JSON.parse(received[i]));
        else
            blobs.push(received[i]);
    }

    if (!blobs.length) {
        display.cancelZoom();
        return;
    }

    var graph = this.mergeJSON(blobs);
    display.completeZoom(graph, start, end);
}

AWFY.findX = function (graph, time) {
    for (var i = 0; i < graph.timelist.length; i++) {
        if (graph.timelist[i] >= time)
            break;
    }
    return i;
}

AWFY.requestZoom = function (display, kind, start_t, end_t) {
    // Figure out the list of dates we'll need to query.
    var files = [];

    var start = new Date(start_t * 1000);
    var end = new Date(end_t * 1000);
    for (var year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year++) {
        var firstMonth = (year == start.getUTCFullYear())
                         ? start.getUTCMonth() + 1
                         : 1;
        var lastMonth = (year == end.getUTCFullYear())
                        ? end.getUTCMonth() + 1
                        : 12;
        for (var month = firstMonth; month <= lastMonth; month++) {
            var name = display.prefix +
                       kind + '-' +
					   display.id + '-' +
					   this.machineId + '-' +
                       year + '-' +
                       month;
            files.push(name);
        }
    }

    var zoom = function (received) {
        this.computeZoom(display, received, start_t, end_t);
    }

    this.request(files, zoom.bind(this));
}

AWFY.trackZoom = function (start, end) {
    // Only track in single modus
    if (this.view != 'single')
        return;

    this.start = start;
    this.end = end;
    this.pushState();
}

AWFY.showOverview = function () {
    this.reset('overview');

    $('#breakdown').empty();
    $('#breakdown').hide();

    $('.graph-container').show();

    this.suiteName = null;
    this.subtest = null
    this.start = null
    this.end = null
    this.panes = [$('#ss-graph'),
                  $('#kraken-graph'),
                  $('#octane-graph')
                 ];

    this.request(['aggregate-' + this.machineId], this.computeAggregate.bind(this));
    this.lastRefresh = Date.now();
}

AWFY.showBreakdown = function (name) {
    this.reset('breakdown');

    // Clear the breakdown view.
    var breakdown = $('#breakdown');
    breakdown.empty()

    $('.graph-container').hide();
    breakdown.show();

    this.suiteName = name;
    this.start = null
    this.end = null
    this.subtest = null;
    this.panes = [];

    var total = 0;

	// Create a div showing the full benchmark score.
	var id = name;
	var prefix = "";
	var domid = id.replace(/ /g,'-').replace(/\./g, '-') + "-single";
	var title = $('<div id="' + domid + '-title"></div>').html('<b>' + id + '</b>').appendTo(breakdown);
	title.hide();
	var div = $('<div id="' + domid + '-graph" class="graph"></div>');
	div.appendTo(breakdown);
	div.hide();
	$('<br><br>').appendTo(breakdown);

	this.panes.push(div);

	var callback = (function (prefix, id, domid) {
			return (function (received) {
				if (received[0])
					this.computeBreakdown(received[0], prefix, id, domid);
				this.drawLegend();
				}).bind(this);
			}).bind(this)(prefix, id, domid);

	var file = prefix + 'aggregate-' + id + '-' + this.machineId;
	this.request([file], callback);

    // Create a div for each sub-test.
    var suite = AWFYMaster.suites[name];
    for (var i = 0; i < suite.tests.length; i++) {
        var test = suite.tests[i];
        var id = name + '-' + test;
		var prefix = "bk-";
        var domid = id.replace(/ /g,'-').replace(/\./g, '-');
        ( function (name, test) {
            var title = $('<div id="' + domid + '-title"></div>').click(
                (function (event) {
                 this.showSingle(name, test, null, null);
                 this.pushState();
                 return false;
                 }).bind(this))
            .html('<b><a href="#">' + id + '</a></b>')
            .appendTo(breakdown);
            title.hide();
            }.bind(this)  )(name, test)
        var div = $('<div id="' + domid + '-graph" class="graph"></div>');
        div.appendTo(breakdown);
        div.hide();

        this.panes.push(div);

        var callback = (function (prefix, id, domid) {
                return (function (received) {
                    if (received[0])
                        this.computeBreakdown(received[0], prefix, id, domid);
                    if (++total == suite.tests.length)
                    this.drawLegend();
                    }).bind(this);
                }).bind(this)(prefix, id, domid);

        // Fire off an XHR request for each test.
        var file = prefix + 'aggregate-' + id + '-' + this.machineId;
        this.request([file], callback);
    }
    this.lastRefresh = Date.now();
}

AWFY.showSingle = function (name, subtest, start, end) {
    this.reset('single');

    // Clear the breakdown view.
    var breakdown = $('#breakdown');
    breakdown.empty()

    $('.graph-container').hide();
    breakdown.show();

    this.suiteName = name;
    this.subtest = subtest;
    this.start = start;
    this.end = end;
    this.panes = [];

    // Test existance of subtest
    var suite = AWFYMaster.suites[name];
    var found = false;
    for (var i = 0; i < suite.tests.length; i++) {
        var test = suite.tests[i];
        if (subtest == test) {
            found = true;
            break;
        }
    }

    if (found) {
        var id = name + '-' + test;
		var prefix = "bk-";
        var domid = id.replace(/ /g,'-').replace(/\./g, '-');
        var title = $('<div id="' + domid + '-title"></div>').html('<b>' + id + '</b>').appendTo(breakdown);
		title.hide();
        var div = $('<div id="' + domid + '-graph" class="graph"></div>');
        div.appendTo(breakdown);
        div.hide();
        $('<br><br>').appendTo(breakdown);

        this.panes.push(div);

        var callback = (function (prefix, id, domid) {
                return (function (received) {
                    if (received[0])
                        this.computeBreakdown(received[0], prefix, id, domid);
                    this.drawLegend();
                    }).bind(this);
                }).bind(this)(prefix, id, domid);

        var file = prefix + 'aggregate-' + id + '-' + this.machineId;
        this.request([file], callback);
    } else {
        var id = name;
		var prefix = "";
        var domid = id.replace(/ /g,'-').replace(/\./g, '-') + "-single";
        var title = $('<div id="' + domid + '-title"></div>').html('<b>' + id + '</b>').appendTo(breakdown);
		title.hide();
        var div = $('<div id="' + domid + '-graph" class="graph"></div>');
        div.appendTo(breakdown);
        div.hide();
        $('<br><br>').appendTo(breakdown);

        this.panes.push(div);

        var callback = (function (prefix, id, domid) {
                return (function (received) {
                    if (received[0])
                        this.computeBreakdown(received[0], prefix, id, domid);
                    this.drawLegend();
                    }).bind(this);
                }).bind(this)(prefix, id, domid);

        var file = prefix + 'aggregate-' + id + '-' + this.machineId;
        this.request([file], callback);
    }

    this.lastRefresh = Date.now();
}

AWFY.isSubtest = function() {
	if (this.view == 'overview')
		return false;
	if (this.view == 'breakdown')
		return true;
	if (this.view == 'single') {
		if (this.subtest)
			return true; 
		else
			return false;
	}
	throw new Exception();
}

AWFY.requestRedraw = function () {
    if (this.view == 'overview') {
        this.request(['aggregate-' + this.machineId],
                this.computeAggregate.bind(this));
    } else if (this.view == 'breakdown') {
        var suite = AWFYMaster.suites[this.suiteName];
        var total = 0;
        for (var i = 0; i < suite.tests.length; i++) {
            var id = this.suiteName + '-' + suite.tests[i];
			var prefix = "bk-";
			var domid = id.replace(/ /g,'-').replace(/\./g, '-');
            var callback = (function (prefix, id, domid) {
                    return (function (received) {
                        if (received[0])
                            this.computeBreakdown(received[0], prefix, id, domid);
                        if (++total == suite.tests.length)
                            this.drawLegend();
                        }).bind(this);
                    }).bind(this)(prefix, id, domid);
            var file = prefix + 'aggregate-' + id + '-' + this.machineId;
            this.request([file], callback);
        }
    } else if (this.view == 'single') {
        var suite = AWFYMaster.suites[this.suiteName];
        var found = false;    
        for (var i = 0; i < suite.tests.length; i++) {
            if (suite.tests[i] == this.subtest) {
                found = true;
                break;
            }
        }
        if (found) {
            var id = this.suiteName + '-' + this.subtest;
			var prefix = "bk-";
			var domid = id.replace(/ /g,'-').replace(/\./g, '-');
            var callback = (function (prefix, id, domid) {
                    return (function (received) {
                        if (received[0])
                            this.computeBreakdown(received[0], prefix, id, domid);
                        this.drawLegend();
                        }).bind(this);
                    }).bind(this)(prefix, id, domid);
            var file = prefix + 'aggregate-' + id + '-' + this.machineId;
            this.request([file], callback);
        } else {
            var id = this.suiteName;
			var prefix = "";
			var domid = id.replace(/ /g,'-').replace(/\./g, '-') + "-single";
            var callback = (function (prefix, id, domid) {
                    return (function (received) {
                        if (received[0])
                            this.computeBreakdown(received[0], prefix, id, domid);
                        this.drawLegend();
                        }).bind(this);
                    }).bind(this)(prefix, id, domid);
            var file = prefix + 'aggregate-' + id + '-' + this.machineId;
            this.request([file], callback);
        }
    }
    this.lastRefresh = Date.now();
}

AWFY.changeMachine = function (machine_id) {
    this.reset(this.view);
    this.machineId = machine_id;
    this.requestRedraw();
}

AWFY.reset = function (view) {
    // Delete everything from the existing panes.
    for (var i = 0; i < this.panes.length; i++) {
        var elt = this.panes[i];
        var display = elt.data('awfy-display');
        if (!display)
            continue;
        display.shutdown();

        // If we're changing views, remove the display.
        if (this.view != view) {
            elt.data('awfy-display', null);
            elt.empty();
        }
    }

    for (var mode in AWFYMaster.modes)
        AWFYMaster.modes[mode].used = false;

    this.hasLegend = false;
    this.aggregate = { };
    this.view = view;

    // Drop all outstanding XHR requests.
    for (var i = 0; i < this.xhr.length; i++)
        this.xhr[i].abort();
    this.xhr = [];
}

AWFY.onHashChange = function () {
    this.parseURL();
}

AWFY.refresh = function () {
    if (Date.now() - this.lastRefresh >= this.refreshTime)
        this.requestRedraw();
    window.setTimeout(this.refresh.bind(this), this.refreshTime * 1000);
}

AWFY.parseURL = function () {
    if (this.lastHash == window.location.hash)
        return;

    var query = window.location.hash.substring(1);
    var items = query.split('&');
    this.queryParams = {};
    for (var i = 0; i < items.length; i++) {
        var item = items[i].split('=');
        this.queryParams[item[0]] = decodeURIComponent(item[1]);
    }

    var machineId;
    if ('machine' in this.queryParams)
        machineId = parseInt(this.queryParams['machine']);
    else
        machineId = this.DEFAULT_MACHINE_ID;

    var view = this.queryParams['view'];
    if (!view || (view != 'overview' && view != 'breakdown' && view != 'single'))
        view = 'overview';
    if (view == 'breakdown' || view == 'single') {
        var suiteName = this.queryParams['suite'];
        if (!suiteName || !AWFYMaster.suites[suiteName]) {
			window.location.hash = "#machine=" + machineId;
			return false;
		}
    }
	if (view == 'breakdown') {
		// Speedometer has no subscores. Show total score.
		if (AWFYMaster.suites[suiteName].tests.length == 0) {
			window.location.hash = "#machine=" + machineId + "&view=single&suite=" + suiteName;
			return false;
		}
	}
    var start = null;
    var end = null;
    if (view == 'single') {
        var subtest = this.queryParams['subtest'];
        var suite = AWFYMaster.suites[suiteName];
        var found = false;
        for (var i = 0; i < suite.tests.length; i++) {
            var test = suite.tests[i];
            if (subtest != test)
                continue;
            found = true;
            break;
        }
        if (subtest && !found) {
			window.location.hash = "#machine=" + machineId + "&view=breakdown&suite=" + suiteName;
			return false;
        } else {
            start = (this.queryParams['start'])?parseInt(this.queryParams['start']):null;
            end = (this.queryParams['end'])?parseInt(this.queryParams['end']):null;
        }
    }

    // Make sure the menus are up to date.
    if (this.view != 'none') {
        if (this.machineId != machineId) {
            this.updateMachineList(machineId);
            this.updateSuiteList(machineId);
        }
        $('#breakdownlist .clicked').removeClass('clicked');
        if (view == 'overview')
            $('#suite-overview').addClass('clicked');
        else if (view == 'breakdown')
            $('#suite-' + suiteName).addClass('clicked');
    }

    if (view == this.view) {
        // See if we just need to change the current machine.
        if (view == 'overview') {
            if (machineId != this.machineId)
                this.changeMachine(machineId);
            this.lastHash = window.location.hash;
            return true;
        } else if (view == 'breakdown' || view == 'single') {
            if (suiteName == this.suiteName) {
                if (machineId != this.machineId) 
                    this.changeMachine(machineId);
                this.lastHash = window.location.hash;
                return true;
            }
        }
    }

    // Nope.
    this.machineId = machineId;

    if (view == 'overview')
        this.showOverview();
    else if (view == 'breakdown')
        this.showBreakdown(suiteName);
    else if (view == 'single')
        this.showSingle(suiteName, subtest, start, end);

    this.lastHash = window.location.hash;
	return true;
}

AWFY.updateMachineList = function (machineId) {
    var menu = $('#machinelist');
    menu.empty();
    var showAll = false;
    if (!AWFYMaster.machines[machineId].frontpage)
        showAll = true;

	var machines_ids = []
    for (var id in AWFYMaster.machines) {
		machines_ids.push(id);
	}
    machines_ids.sort(function(a,b) {return AWFYMaster.machines[a].description > AWFYMaster.machines[b].description});

	for (var i = 0; i < machines_ids.length; i++) {
		var id = machines_ids[i];
        var machine = AWFYMaster.machines[id];
        if (!showAll && !machine.frontpage)
            continue;
        var li = $('<li></li>');
        var a = $('<a href="#" id="machine' + id + '"></a>');
        a.click((function (id) {
            return (function (event) {
                this.updateMachineList(parseInt(id));
                this.updateSuiteList(parseInt(id));
                this.changeMachine(parseInt(id));
                this.pushState();
                return false;
            }).bind(this);
        }).bind(this)(id));
        if (parseInt(id) == machineId)
            li.addClass('clicked');
        if (!machine.recent_runs)
            li.addClass('inactive');
        a.html(machine.description);
        a.appendTo(li);
        li.appendTo(menu);
    }
    var view = $("<div><a href='#' class='show'>[Show hidden machines]</a><a href='#' class='hide'>[Hide hidden machines]</a></div>");
	view.click(function() {
		menu.toggleClass("all");
		return false;
	});
	menu.append(view);
    $('#message').html(AWFYMaster.machines[machineId].message+"<br />&nbsp;");
}

AWFY.updateSuiteList = function (machineId) {
    var breakdown = $('#breakdownlist');
    breakdown.empty(); 

    var home = $('<a href="#" id="suite-overview"></a>').click(
        (function (event) {
            $('#breakdownlist .clicked').removeClass('clicked');
            $(event.target).addClass('clicked');
            this.showOverview();
            this.pushState();
            return false;
         }).bind(this))
    .html('Overview')
    .appendTo($('<li></li>').appendTo(breakdown));
    if (this.view == 'overview')
        home.addClass('clicked');

    var suites = [];
    for (var i=0; i < AWFYMaster.machines[machineId].suites.length; i++) {
        var name = AWFYMaster.machines[machineId].suites[i];
        if (AWFYMaster.suites[name])
            suites.push([name, AWFYMaster.suites[name]]);
    }

    suites.sort(function (a, b) {
        return a[1].sort_order - b[1].sort_order;
    });

    for (var i = 0; i < suites.length; i++) {
        var name = suites[i][0];
        var suite = suites[i][1];
        var li = $('<li></li>');
        var a = $('<a href="#" id="suite-' + name + '"></a>');
        a.click((function (name) {
            return (function(event) {
                $('#breakdownlist .clicked').removeClass('clicked');
                $(event.target).addClass('clicked');
			    window.location.hash = "#machine=" + this.machineId + "&view=breakdown&suite=" + name;
                return false;
            }).bind(this);
        }).bind(this)(name));
        if ((this.view == 'breakdown' || this.view == 'single') && this.suiteName == name)
            a.addClass('clicked');
        a.html(suite.description);
        a.appendTo(li);
        li.appendTo(breakdown);
    }
}

AWFY.startup = function () {
    this.panes = [$('#ss-graph'),
                  $('#kraken-graph'),
                  $('#octane-graph')];

    while (!this.parseURL()) {}

    // Add machine information to the menu.
    var menu = $('#machinelist');
    this.updateMachineList(this.machineId);

    // Hide it by default.
    $('#machinedrop').click((function (event) {
        if (!menu.is(':visible') && !$('#about').is(':visible')) {
            menu.show();
        } else {
            menu.hide();
        }
        return false;
    }).bind(this));
    menu.hide();

    // Add suite information to menu
    var breakdown = $('#breakdownlist');
    this.updateSuiteList(this.machineId);

    // Hide it by default.
    $('#bkdrop').click((function (event) {
        if (!breakdown.is(':visible') && !$('#about').is(':visible')) {
            breakdown.show();
        } else {
            breakdown.hide();
        }
        return false;
    }).bind(this));
    breakdown.hide();

    var about = $('#aboutdrop');
    about.click((function (event) {
        var help = $('#about');
        if (!help.is(':visible')) {
            $('.graph-container').hide();
            $('#breakdown').hide();
            help.show();
            about.text('Home');
            $('#breakdownhook').hide();
            $('#machinehook').hide();
            for (var i = 0; i < this.panes.length; i++) {
                var elt = this.panes[i];
                var display = elt.data('awfy-display');
                if (display)
                    display.hideToolTips();
            }
        } else {
            help.hide();
            if (this.view == 'breakdown')
                $('#breakdown').show();
            else
                $('.graph-container').show();
            about.text('About');
            $('#breakdownhook').show();
            $('#machinehook').show();
            for (var i = 0; i < this.panes.length; i++) {
                var elt = this.panes[i];
                var display = elt.data('awfy-display');
                if (display)
                    display.showToolTips();
            }
        }
        menu.hide();
        breakdown.hide();
        this.pushState();
        return false;
    }).bind(this));

    if (this.queryParams['help'])
        about.trigger('click');

    $(window).hashchange(this.onHashChange.bind(this));
    $(window).bind('popstate', this.onHashChange.bind(this));

    window.setTimeout(this.refresh.bind(this), this.refreshTime * 1000);
}

