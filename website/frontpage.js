// vim: set ts=4 sw=4 tw=99 et:

function DrawGraph(awfy, elt, data, graph)
{
    var options = { };

    options.lines = { show: true };
    options.points = { fillColor: "#ffffff", show: true };
    options.borderWidth = 1.5;
    options.borderColor = "#BEBEBE";
    options.legend = { show: false };
    options.xaxis = { };
    options.yaxis = { min: 0 };
    options.grid = { };

    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    var historical;
    if (graph.aggregate) {
        // Find the range of historical points.
        for (var i = 0; i < graph.timelist.length; i++) {
            if (graph.timelist[i] >= graph.earliest)
                break;
        }

        if (i && i != graph.timelist.length)
            historical = i;
    }

    // If the graph has both historical and recent points, indicated by
    // the "historical" midpoint, then we change some graph formatting
    // to reflect that part of the graph has a greater time density.
    if (historical) {
        options.points.symbol = function (ctx, x, y, radius, shadow, plot) {
            var axis = plot.getAxes();
            var rx = Math.round(axis.xaxis.c2p(x));
            if (graph.timelist[rx] < graph.earliest) {
                ctx.strokeRect(x - radius / 2, y - radius / 2, radius, radius);
                ctx.clearRect(x - radius / 4, y - radius / 4, radius / 2, radius / 2);
            } else {
                ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
            }
        }

        // Copy flot's tick algorithm.
        var sizefn = function (min, max) {
            var noTicks = 0.3 * Math.sqrt(elt.width());
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
        }

        // If the aggregate graph has both historical and recent points, 
        var ticks = sizefn(0, graph.timelist.length);
        options.xaxis.ticks = [];
        for (var i = 0; i < historical; i += ticks) {
            var d = new Date(graph.timelist[Math.floor(i)] * 1000);
            var text = months[d.getMonth()] + " " + d.getDate();
            options.xaxis.ticks.push([i, text]);
        }

        // Draw the recent ticks, but try to increase the density. This is
        // all a bunch of special cased hacks for now, since all our graphs
        // appear to compute ticksize = 5.
        if (ticks == 5) {
            // Make sure we don't skip too many lines in between.
            if (i - historical >= 3)
                i = historical + 2;
            ticks = 6;
        }
        for (; i < graph.timelist.length; i += ticks) {
            var d = new Date(graph.timelist[Math.floor(i)] * 1000);
            var text = months[d.getMonth()] + " " + d.getDate();
            options.xaxis.ticks.push([i, text]);
            if (ticks == 6) {
                options.xaxis.ticks.push([i + 2, ""]);
                options.xaxis.ticks.push([i + 4, ""]);
            }
        }
    }

    if (!options.xaxis.ticks) {
        options.xaxis.tickFormatter = function (v, axis) {
            v = Math.round(v);
            if (v < 0 || v >= graph.timelist.length)
                return '';
            var t = graph.timelist[v];
            var d = new Date(t * 1000);
            return months[d.getMonth()] + " " + d.getDate();
        }
    }

    var plot = $.plot(elt, graph.lines, options);
}

function DrawFrontPage(awfy, data)
{
    var graphs = data.graphs;

    DrawGraph(awfy, $("#kraken-graph"), data, graphs['kraken']);
    DrawGraph(awfy, $("#sunspider-graph"), data, graphs['ss']);
    DrawGraph(awfy, $("#v8-graph"), data, graphs['v8real']);
}

