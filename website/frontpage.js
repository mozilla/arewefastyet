// vim: set ts=4 sw=4 tw=99 et:
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

function Display(awfy, id, elt)
{
    this.awfy = awfy;
    this.id = id;
    this.elt = elt;
    this.attachedTips = [];
    this.plot = null;
    this.hovering = null;
    this.graph = null;
    this.orig_graph = null;
}

Display.prototype.setGraph = function (graph)
{
    // We keep both the original dataset and the one we send and display to
    // flot, so we can redraw and hide lines. In the future this should be
    // tightened up, so that code working with the display graph uses "graph"
    // and code (if any) working with the original data set uses "orig_graph".
    // And really no code should be accessing "graph" until draw().
    this.orig_graph = graph;
    this.graph = graph;
}

Display.prototype.setup = function (graph)
{
    this.setGraph(graph);

    this.selectDelay = null;

    if (graph.aggregate)
        this.setHistoricalMidpoint();
    else
        this.aggregate = -1;

    this.zoomInfo = { prev: null,
                      level: 'aggregate'
                    };

    this.elt.bind("plothover", this.onHover.bind(this));
    this.elt.bind('plotclick', this.onClick.bind(this));
    this.elt.bind('plotselected', this.plotSelected.bind(this));
    this.elt.bind('dblclick', (function () {
        if (this.zoomInfo.level != 'aggregate')
            this.unzoom();
    }).bind(this));
}

Display.MaxPoints = 50;
Display.Months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

Display.prototype.shutdown = function () {
    this.elt.unbind('plothover');
    this.elt.unbind('plotclick');
    this.elt.unbind('plotselected');
    this.elt.unbind('dblclick');
    if (this.hovering) {
        this.hovering.remove();
        this.hovering = null;
    }
    this.detachTips();
    this.plot = null;
    this.setGraph(null);
}

Display.prototype.shouldRefresh = function () {
    if (this.graph) {
        for (var i = 0; i < this.attachedTips.length; i++) {
            var tooltip = this.attachedTips[i];
            if (tooltip.attached())
                return false;
        }
        if (this.zoomInfo.level != 'aggregate')
            return false;
        this.shutdown();
    }
    return true;
}

Display.prototype.setHistoricalMidpoint = function () {
    // Find the range of historical points.
    for (var i = 0; i < this.graph.timelist.length; i++) {
        if (this.graph.timelist[i] >= this.graph.earliest)
            break;
    }

    if (i && i != this.graph.timelist.length)
        this.historical = i;
}

// Copy flot's tick algorithm.
Display.prototype.tickSize = function (min, max) {
    var noTicks = 0.3 * Math.sqrt(this.elt.width());
    var delta = (max - min) / noTicks;
    var dec = -Math.floor(Math.log(delta) / Math.LN10);
    var magn = Math.pow(10, -dec);
    var norm = delta / magn;
    var size;
    if (norm < 1.5) {
        size = 1;
    } else if (norm < 3) {
        size = 2;
        if (norm > 2.25) {
            size = 2.5;
            ++dec;
        }
    } else if (norm < 7.5) {
        size = 5;
    } else {
        size = 10;
    }

    size *= magn;
    return size;
};

Display.prototype.aggregateTicks = function () {
    // Draw historical ticks at a higher density.
    var ticks = this.tickSize(0, this.graph.timelist.length);
    var list = [];

    // This is all a bunch of hardcoded hacks for now.
    var preticks, preticklist;

    if (ticks == 5) {
        preticks = 6;
        preticklist = [2, 4];
    } else if (ticks == 10) {
        preticks = 9;
        preticklist = [3, 6];
    } else {
        preticks = ticks;
    }

    var last_year = undefined;
    var current_year = (new Date()).getFullYear();
    for (var i = 0; i < this.historical; i += preticks) {
        var d = new Date(this.graph.timelist[i] * 1000);
        var text = Display.Months[d.getMonth()];

        // Some graphs span over a year, so add in a hint when the year
        // changes.
        if ((i == 0 && d.getFullYear() != current_year) ||
            (last_year && d.getFullYear() != last_year))
        {
            text += " " + d.getFullYear();
            last_year = d.getFullYear();
        }

        // Add the tick mark, then try to add some more empty ones to
        // make the graph appear denser.
        list.push([i, text]);
        if (preticklist) {
            for (var j = 0; j < preticklist.length; j++) {
                var v = i + preticklist[j];
                if (v >= this.historical)
                    break;
                list.push([v, ""]);
            }
        }
    }

    // Figure out where we should start placing sparser lines, since
    // we don't want them too close to the historical lines.
    i = list[list.length - 1][0] + ticks;

    // If the aggregate graph has both historical and recent points, 
    for (; i < this.graph.timelist.length; i += ticks) {
        var d = new Date(this.graph.timelist[Math.floor(i)] * 1000);
        var text = Display.Months[d.getMonth()] + " " + d.getDate();
        list.push([i, text]);
    }

    return list;
}

Display.prototype.draw = function () {
    var options = { };
    
    // We always start out by using the original graph, since we may modify
    // this one locally. Start by stripping out any lines that should be
    // hidden.
    var new_info = [];
    var new_lines = [];
    for (var i = 0; i < this.orig_graph.info.length; i++) {
        var info = this.orig_graph.info[i];
        var mode = AWFYMaster.modes[info.modeid];
        if (!mode)
            continue;

        // Strip JM+TI, BC
        if (info.modeid == 12 || info.modeid == 15)
            continue;

        mode.used = true;
        if (mode.hidden)
            continue;

        new_info.push(info);
        new_lines.push(this.orig_graph.lines[i]);
    }
    this.graph = {
        lines: new_lines,
        info: new_info,
        timelist: this.orig_graph.timelist,
        earliest: this.orig_graph.earliest,
        aggregate: this.orig_graph.aggregate,
        direction: this.orig_graph.direction
    };

    options.lines = { show: true };
    options.points = { fillColor: "#ffffff", show: true };
    options.borderWidth = 1.5;
    options.borderColor = "#BEBEBE";
    options.legend = { show: false };
    options.xaxis = { };
    options.yaxis = { };
    options.grid = { hoverable: true, clickable: true };
    options.selection = { mode: 'x' }

    // Aggregate view starts from 0. We space things out when zooming in.
    if (this.graph.aggregate && this.awfy.type != 'overview')
        options.yaxis.min = 0;

    if (this.graph.direction == 1) {
		options.yaxis.transform = function (v) {
            return -v;
        };
		options.yaxis.inverseTransform = function (v) {
            return -v;
        };
    } else {
        options.yaxis.tickFormatter = function (v, axis) {
            return v + 'ms';
        };
    }

    if (this.graph.aggregate && this.historical) {
        // If the graph has both historical and recent points, indicated by
        // the "historical" midpoint, then we change some graph formatting
        // to reflect that part of the graph has a greater time density.
        //
        // To make this work, we modified flot to pass in its plot variable
        // when invoking this callback, in order to use c2p().
        options.points.symbol = (function (ctx, x, y, radius, shadow, plot) {
            var axis = plot.getAxes();
            var rx = Math.round(axis.xaxis.c2p(x));
            if (this.graph.timelist[rx] < this.graph.earliest) {
                ctx.strokeRect(x - radius / 3, y - radius / 3, radius * 2/3, radius * 2/3);
                // Disable clearRect due to bug in Firefox for Android (bug 936177)
                //ctx.clearRect(x - radius / 4, y - radius / 4, radius / 2, radius / 2);
            } else {
                ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
            }
        }).bind(this);

        options.xaxis.ticks = this.aggregateTicks();
    }

    options.yaxis.tickFormatter = function  (v, axis) {
        if (Math.round(v) != v)
            return v.toFixed(2);
        return v;
    }

    if (!options.xaxis.ticks) {
        options.xaxis.tickFormatter = (function (v, axis) {
            v = Math.round(v);
            if (v < 0 || v >= this.graph.timelist.length)
                return '';
            var t = this.graph.timelist[v];
            var d = new Date(t * 1000);
            return Display.Months[d.getMonth()] + " " + d.getDate();
        }).bind(this);
    }

    this.plot = $.plot(this.elt, this.graph.lines, options);
}

Display.prototype.plotSelected = function (event, ranges) {
    this.selectDelay = new Date();

    var from_x = Math.floor(ranges.xaxis.from);
    if (from_x == ranges.xaxis.from)
        from_x -= 1;
    if (from_x < 0)
        from_x = 0;

    var to_x = Math.ceil(ranges.xaxis.to);
    if (to_x == ranges.xaxis.to)
        to_x += 1;
    if (to_x >= this.graph.timelist.length)
        to_x = this.graph.timelist.length - 1;

    var start = this.graph.timelist[from_x];
    var end = this.graph.timelist[to_x];

    var prev = this.zoomInfo.prev;
    if (prev && this.zoomInfo.level == 'month') {
        // Estimate the number of datapoints we had in the old range.
        var oldstart = AWFY.findX(prev, this.graph.timelist[0]);
        var oldend = AWFY.findX(prev, this.graph.timelist[this.graph.timelist.length - 1]);

        // Estimate the number of datapoints we'd have in the new range.
        var newstart = AWFY.findX(prev, start);
        var newend = AWFY.findX(prev, end);

        // Some heuristics to figure out whether we should fetch more data.
        var zoom = (newend - newstart) / (oldend - oldstart);
        if ((zoom >= 0.8 && (newend - newstart >= Display.MaxPoints * 1.5)) ||
            (newend - newstart >= Display.MaxPoints * 5))
        {
            // Okay! Trim the cached graph, then display.
            var graph = AWFY.trim(prev, newstart, newend);
            this.localZoom(graph);
            return;
        }
    }

    // If we already have the highest level of data, jump right in.
    if (prev && this.zoomInfo.level == 'raw') {
        var oldstart = AWFY.findX(prev, this.graph.timelist[0]);
        var oldend = AWFY.findX(prev, this.graph.timelist[this.graph.timelist.length - 1]);

        this.plot.clearSelection();

        // If we can't really zoom in any more, don't bother.
        if (oldend - oldstart < Display.MaxPoints / 2)
            return;

        // Require at least a few datapoints.
        var newstart = AWFY.findX(prev, start);
        var newend = AWFY.findX(prev, end);
        if (oldend - oldstart <= 3)
            return;

        var graph = AWFY.trim(prev, newstart, newend);
        this.localZoom(graph);
        return;
    }

    // Disable further selections since we wait for the XHR to go through.
    this.plot.disableSelection();

    // Clear the cached graph, since we'll get a new one.
    this.zoomInfo.prev = null;

    if (this.zoomInfo.level == 'aggregate') {
        this.awfy.requestZoom(this, 'condensed', start, end);
        this.zoomInfo.level = 'month';
    } else {
        this.awfy.requestZoom(this, 'raw', start, end);
        this.zoomInfo.level = 'raw';
    }
}

Display.prototype.localZoom = function (graph) {
    graph = AWFY.condense(graph, Display.MaxPoints);
    this.setGraph(graph);
    this.draw();
    this.plot.enableSelection();
    this.plot.clearSelection();
    this.detachTips();
}

Display.prototype.completeZoom = function (graph, start, end) {
    // Copy properties from the old graph before resetting.
    graph.direction = this.graph.direction;

    // Cache the original graph in case it's dense enough to zoom in more
    // without fetching more points via XHR.
    if (!this.zoomInfo.prev)
        this.zoomInfo.prev = graph;

    var first = AWFY.findX(graph, start);
    var last = AWFY.findX(graph, end);
    graph = AWFY.trim(graph, first, last);

    // If we got a paltry number of datapoints, skip this and zoom in more.
    if (this.zoomInfo.level == 'month' && graph.timelist.length < Display.MaxPoints / 2) {
        this.zoomInfo.prev = null;
        this.awfy.requestZoom(this, 'raw', start, end);
        this.zoomInfo.level = 'raw';
        return;
    }

    this.localZoom(graph);
}

Display.prototype.cancelZoom = function () {
    this.plot.enableSelection();
    this.plot.clearSelection();

    // Reset the zoom level we think we have.
    if (!this.zoomInfo.prev) {
        if (this.zoomInfo.level == 'raw')
            this.zoomInfo.level = 'month';
        else if (this.zoomInfo.level == 'month')
            this.zoomInfo.level = 'aggregate';
    }
}

Display.prototype.unzoom = function () {
    this.setGraph(AWFY.aggregate[this.id]);
    this.setHistoricalMidpoint();
    this.draw();
    this.plot.enableSelection();
    this.plot.clearSelection();
    this.detachTips();
    this.zoomInfo.level = 'aggregate';
}

Display.prototype.detachTips = function () {
    for (var i = 0; i < this.attachedTips.length; i++)
        this.attachedTips[i].detach();
    this.attachedTips = [];
}

Display.prototype.createToolTip = function (item, extended) {
    var so = extended ? '<strong>' : '';
    var sc = extended ? '</strong>' : '';

    var x = item.datapoint[0];
    var y = item.datapoint[1];
    var text = so + 'score: ' + sc + y.toFixed() + '<br>';

    // Figure out the line this corresponds to.
    var line = this.graph.info[item.seriesIndex];
    if (!line)
        return;

    // Find the point previous to this one.
    var prev = null;
    for (var i = x - 1; i >= 0; i--) {
        if (line.data[i] && line.data[i][0]) {
            prev = line.data[i];
            break;
        }
    }

    if (prev) {
        // Compute a difference.
        var diff = Math.round((y - prev[0]) * 10) / 10;
        var perc = -Math.round(((y - prev[0]) / prev[0]) * 1000) / 10;
        var better;
        if ((perc < 0 && this.graph.direction == -1) ||
            (perc > 0 && this.graph.direction == 1))
        {
            better = 'worse';
        } else {
            better = 'better';
        }
        perc = Math.abs(perc);

        if (diff === diff) {
            if (extended)
                text += so + 'delta' + sc + ': ' + diff;
            else
                text += String.fromCharCode(916) + ': ' + diff;
            if (this.graph.direction == -1)
                text += 'ms';
            text += ' (' + perc + '% ' + better + ')<br>';
        }
    }

    // Find the vendor.
    var mode = AWFYMaster.modes[line.modeid];
    var vendor;
    if (mode)
        vendor = AWFYMaster.vendors[mode.vendor_id];
    if (vendor) {
        text += so + 'source: ' + sc +
                vendor.browser +
                ' (' + mode.name + ')'+
                '<br>';
    }

    // Find the datapoint.
    var point = line.data[x];

    if (extended) {
        if (point.length > 1 && point[2] && point[1] != point[2]) {
            if (vendor.rangeURL) {
                var url = vendor.rangeURL
                            .replace("{from}", point[1])
                            .replace("{to}", point[2]);
                text += so + 'revs: ' + sc +
                             '<a href="' + url + '">' + point[1] + " to " + point[2] + '</a>';
            } else {
                text += so + 'revs: ' + sc +
                        '<a href="' + vendor.url + point[1] + '">' + point[1] + '</a>' +
                        ' to ' +
                        '<a href="' + vendor.url + point[2] + '">' + point[2] + '</a>';
            }
        } else {
            text += so + 'rev: ' + sc +
                    '<a href="' + vendor.url + point[1] + '">' + point[1] + '</a>';

            if (prev && vendor.rangeURL) {
                var url = vendor.rangeURL
                            .replace("{from}", prev[1])
                            .replace("{to}", point[1])
                            .replace("{num}", point[1] - prev[1]);
                text += ' (<a href="' + url + '">changelog</a>)';
            }
        }
        text += '<br>';
    } else {
        if (point.length > 1 && point[2] && point[1] != point[2]) {
            text += so + 'revs: ' + sc +
                    point[1] +
                    ' to ' +
                    point[2] +
                    '<br>';
        } else {
            text += so + 'rev: ' + sc + point[1] + '<br>';
        }
    }

    var pad = function (d) {
        if (d == 0)
            return '00';
        else if (d < 10)
            return '0' + d;
        else
            return '' + d;
    }

    // Format a year, if we should.
    if (extended) {
        var current_year = (new Date()).getFullYear();
        var datefmt = function (t, forceYear, omitTime) {
            var d = new Date(t * 1000);
            var text = Display.Months[d.getMonth()] + ' ' + d.getDate();
            if (d.getFullYear() != current_year || forceYear)
                text += ', ' + d.getFullYear();
            if (!omitTime && (d.getHours() || d.getMinutes())) {
                text += ' ';
                text += pad(d.getHours()) + ':' +
                        pad(d.getMinutes());
            }
            return text;
        }

        if (point.length > 1 &&
            point[2] && 
            point[1] != point[2] &&
            x < this.graph.timelist.length - 1)
        {
            text += so + 'tested: ' + sc +
                    datefmt(this.graph.timelist[x], false, true) + ' to ' +
                    datefmt(this.graph.timelist[x + 1], true, true) + '<br>';
        } else {
            text += so + 'tested: ' + sc +
                    datefmt(this.graph.timelist[x], false, false) + '<br>';
        }
    } else {
        // Include a short timestamp if we're looking at recent changesets.
        var d = new Date(this.graph.timelist[x] * 1000);
        var now = new Date();
        text += so + 'tested: ' + sc;
        if (this.graph.aggregate && x < this.historical)
            text += 'around ';
        text += Display.Months[d.getMonth()] + ' ' + d.getDate();
        if (now.getFullYear() != d.getFullYear())
            text += ', ' + d.getFullYear() + ' ';
        else
            text += ' ';
        if (!this.graph.aggregate || x >= this.historical)
            text += pad(d.getHours()) + ':' + pad(d.getMinutes()) + '<br>';
    }

    return new ToolTip(item.pageX, item.pageY, item, text);
}

Display.prototype.onClick = function (event, pos, item) {
    // Remove the existing hovertip.
    if (this.hovering) {
        this.hovering.remove();
        this.hovering = null;
    }

    if (!item)
        return;

    if (this.selectDelay) {
        // When unselecting a plot, the cursor might be over a point, which
        // will give us annoying extra tooltips. To combat this, we force a
        // small delay.
        var d = new Date();
        if (d - this.selectDelay <= 1000) {
            this.plot.unhighlight();
            return;
        }
    }

    var tooltip = this.createToolTip(item, true);
    tooltip.drawFloating();

    this.lastToolTip = tooltip;

    // The color of the line will be the series color.
    var line = this.graph.info[item.seriesIndex];
    if (!line)
        return;
    var mode = AWFYMaster.modes[line.modeid];
    if (!mode)
        return;

    tooltip.attachLine(mode.color);
    this.attachedTips.push(tooltip);
}

Display.prototype.areItemsEqual = function (item1, item2) {
    return item1.seriesIndex == item2.seriesIndex &&
           item1.dataIndex == item2.dataIndex &&
           item1.datapoint[0] == item2.datapoint[0];
}

Display.prototype.onHover = function (event, pos, item) {
    // Are we already hovering over something?
    if (this.hovering) {
        // If we're hovering over the same point, don't do anything.
        if (item && this.areItemsEqual(item, this.hovering.item))
            return;

        // Otherwise, remove the div since we will redraw.
        this.hovering.remove();
        this.hovering = null;
    }

    // If we have a pinned tooltip that has not been moved yet, don't draw a
    // second tooltip on top of it.
    if (this.lastToolTip && !this.lastToolTip.dragged && !this.lastToolTip.closed)
        return;

    if (!item)
        return;

    this.hovering = this.createToolTip(item, false);
    this.hovering.drawBasic();
}

Display.prototype.hideToolTips = function () {
    for (var i = 0; i < this.attachedTips.length; i++)
        this.attachedTips[i].hide();
}

Display.prototype.showToolTips = function () {
    for (var i = 0; i < this.attachedTips.length; i++)
        this.attachedTips[i].show();
}

