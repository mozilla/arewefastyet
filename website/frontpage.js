// vim: set ts=4 sw=4 tw=99 et:

function Display(awfy, elt, data, graph)
{
    this.awfy = awfy;
    this.data = data;
    this.graph = graph;
    this.elt = elt;
    this.elt.data('awfy-display', this);

    // The last hovering tooltip we displayed, that has not been clicked.
    this.hovering = null;

    if (graph.aggregate) {
        // Find the range of historical points.
        for (var i = 0; i < graph.timelist.length; i++) {
            if (graph.timelist[i] >= graph.earliest)
                break;
        }

        if (i && i != graph.timelist.length)
            this.historical = i;
    }
}

Display.Months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

    options.lines = { show: true };
    options.points = { fillColor: "#ffffff", show: true };
    options.borderWidth = 1.5;
    options.borderColor = "#BEBEBE";
    options.legend = { show: false };
    options.xaxis = { };
    options.yaxis = { };
    options.grid = { hoverable: true, clickable: true };

    // Aggregate view starts from 0. We space things out when zooming in.
    if (this.graph.aggregate)
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

    if (this.historical) {
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
                ctx.strokeRect(x - radius / 2, y - radius / 2, radius, radius);
                ctx.clearRect(x - radius / 4, y - radius / 4, radius / 2, radius / 2);
            } else {
                ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
            }
        }).bind(this);

        options.xaxis.ticks = this.aggregateTicks();
    }

    if (!options.xaxis.ticks) {
        options.xaxis.tickFormatter = function (v, axis) {
            v = Math.round(v);
            if (v < 0 || v >= this.graph.timelist.length)
                return '';
            var t = this.graph.timelist[v];
            var d = new Date(t * 1000);
            return Display.Months[d.getMonth()] + " " + d.getDate();
        }
    }

    this.plot = $.plot(this.elt, this.graph.lines, options);
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
        if (line.data[i] && line.data[i].score) {
            prev = line.data[i];
            break;
        }
    }

    if (prev) {
        // Compute a difference.
        var diff = Math.round((y - prev.score) * 10) / 10;
        var perc = -Math.round(((y - prev.score) / prev.score) * 1000) / 10;
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
        if (point.last) {
            text += so + 'revs: ' + sc +
                    '<a href="' + vendor.url + point.first + '">' + point.first + '</a>' +
                    ' to ' +
                    '<a href="' + vendor.url + point.last + '">' + point.last + '</a>' +
                    '<br>';
        } else {
            text += so + 'rev: ' + sc +
                    '<a href="' + vendor.url + point.first + '">' + point.first + '</a>' +
                    '<br>';
        }
    } else {
        if (point.last) {
            text += so + 'revs: ' + sc +
                    point.first +
                    ' to ' +
                    point.last +
                    '<br>';
        } else {
            text += so + 'rev: ' + sc + point.first + '<br>';
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
        var datefmt = function (t, forceYear) {
            var d = new Date(t * 1000);
            var text = Display.Months[d.getMonth()] + ' ' + d.getDate();
            if (d.getFullYear() != current_year || forceYear)
                text += ', ' + d.getFullYear();
            if (d.getHours() || d.getMinutes()) {
                text += ' ';
                text += pad(d.getHours()) + ':' +
                        pad(d.getMinutes());
            }
            return text;
        }

        if (point.last && x < this.graph.timelist.length - 1) {
            text += so + 'tested: ' + sc +
                    datefmt(this.graph.timelist[x]) + ' to ' +
                    datefmt(this.graph.timelist[x + 1], true) + '<br>';
        } else {
            text += so + 'tested: ' + sc +
                    datefmt(this.graph.timelist[x]) + '<br>';
        }
    } else {
        // Include a short timestamp if we're looking at recent changesets.
        var d = new Date(this.graph.timelist[x] * 1000);
        var now = new Date();
        var set = false;
        if (now.getMonth() == d.getMonth() &&
            now.getFullYear() == d.getFullYear())
        {
            if (now.getDate() == d.getDate()) {
                text += so + 'tested: ' + sc + 'Today, ';
                set = true;
            } else if (now.getDate() - 1 == d.getDate()) {
                text += so + 'tested: ' + sc + 'Yesterday, ';
                set = true;
            }
        }
        if (!set) {
            text += so + 'tested: ' + sc;
            if (this.graph.aggregate && x < this.historical)
                text += 'around ';
            text += Display.Months[d.getMonth()] + ' ' + d.getDate();
            if (now.getFullYear() != d.getFullYear())
                text += ', ' + d.getFullYear() + ' ';
            else
                text += ' ';
        }
        if (x >= this.historical)
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

Display.drawLegend = function ()
{
    var legend = $("#legend");

    for (var modename in AWFYMaster.modes) {
        var mode = AWFYMaster.modes[modename];
        var vendor = AWFYMaster.vendors[mode.vendor_id];
        var item = $('<li style="border-color:' + mode.color + '"></li>');
        item.text(vendor.browser + ' (' + mode.name + ')');
        item.appendTo(legend);
    }
}

