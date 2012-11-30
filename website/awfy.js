// vim: set ts=4 sw=4 tw=99 et:
"use strict";
var AWFY = { };

AWFY.refreshTime = 1000 * 60 * 5;
AWFY.machineId = 0;
AWFY.refresh = true;
AWFY.hasLegend = false;
AWFY.panes = [];
AWFY.queryParams = {};
AWFY.aggregate = null;
AWFY.xhr = [];

AWFY.request = function (files, callback) {
    var url = window.location.protocol + '//' +
              window.location.host +
              window.location.pathname;
    if (url[url.length - 1] != '/')
        url += '/';
    url += 'data/';

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

        var lines = [];
        for (var i = 0; i < blobgraph.lines.length; i++) {
            var blobline = blobgraph.lines[i];

            var points = [];
            for (var j = 0; j < blobline.data.length; j++) {
                var point = blobline.data[j];
                var score = point && point.score
                            ? point.score
                            : null;
                points.push([j, score]);
            }

            // Mark the mode as used.
            var mode = AWFYMaster.modes[blobline.modeid];
            mode.used = true;

            var line = { color: mode.color, data: points };
            lines.push(line);
        }

        var graph = { lines: lines,
                      direction: blobgraph.direction,
                      aggregate: blobgraph.aggregate,
                      timelist: blobgraph.timelist,
                      earliest: blobgraph.earliest,
                      info: blobgraph.lines
                    };
        graphs[name] = graph;
    }

    // Save this for if/when we need to zoom out.
    this.aggregate = graphs;

    // Everything built successfully, so now we can send this to be drawn.
    for (var i = 0; i < this.panes.length; i++) {
        var id = this.panes[i];
        var elt = $('#' + id + '-graph');
        var graph = graphs[id];
        var display = new Display(this, id, elt, graph);
        display.draw();
    }

    // Draw the legend if needed.
    if (!this.hasLegend) {
        Display.drawLegend();
        this.hasLegend = true;
    }
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
                line = { points: [], info: [] };
                lines[blobline.modeid] = line;
            }

            var points = line.points;
            var info = line.info;

            for (var k = 0; k < blobline.data.length; k++) {
                var point = blobline.data[k];
                var score = point && point.score
                            ? point.score
                            : null;
                points.push([timelist.length + k, score]);
                info.push(point);
            }
        }

        for (var j = 0; j < blob.graph.timelist.length; j++)
            timelist.push(blob.graph.timelist[j]);
    }

    var actual = [];
    var info = [];
    for (var modename in lines) {
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
            for (var j = start; j < pos + slice && j < oldinfo.data.length; j++) {
                var point = oldinfo.data[j];
                if (!point || !point.score)
                    continue;
                if (!first)
                    first = point.first;
                if (point.last)
                    last = point.last;
                average = ((average * count) + point.score) / (count + 1);
                count += 1;
            }

            var score = average ? average : null;
            newline.data.push([timelist.length, score]);

            newinfo.data.push({ 'first': first,
                                'last': last,
                                'score': average
                              });
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
            line.data.push([j - start, point[1]]);
            info.data.push(oldinfo.data[j]);
        }
    }

    return { lines: lines,
             info: infos,
             timelist: timelist,
             direction: graph.direction
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
            var name = kind + '-' +
                       display.id + '-' +
                       year + '-' +
                       month + '-' +
                       this.machineId;
            files.push(name);
        }
    }

    var zoom = function (received) {
        this.computeZoom(display, received, start_t, end_t);
    }

    this.request(files, zoom.bind(this));
}

AWFY.changeMachine = function (machine_id) {
    this.reset();
    this.machineId = machine_id;
    this.request(['aggregate-' + this.machineId],
               this.computeAggregate.bind(this));
}

AWFY.reset = function () {
    // Reset all our state to accept our new graphs.
    for (var i = 0; i < AWFY.panes.length; i++) {
        var id = this.panes[i];
        var elt = $('#' + id + '-graph');
        var display = elt.data('awfy-display');
        if (!display)
            continue;
        display.shutdown();
        elt.data('awfy-display', null);
        elt.empty();
        $('<h2>Loading...</h2>').appendTo(elt);
    }

    this.hasLegend = false;
    this.aggregate = null;

    for (var i = 0; i < this.xhr.length; i++)
        this.xhr[i].abort();
    this.xhr = [];
}

AWFY.startup = function () {
    var query = window.location.search.substring(1);
    var items = query.split('&');
    for (var i = 0; i < items.length; i++) {
        var item = items[i].split('=');
        this.queryParams[item[0]] = item[1];
    }

    if ('machine' in this.queryParams)
        this.machineId = parseInt(this.queryParams['machine']);
    else
        this.machineId = 11;

    this.request(['aggregate-' + this.machineId],
               this.computeAggregate.bind(this));

    // Add machine information to the menu.
    var menu = $('#machinelist');
    for (var id in AWFYMaster.machines) {
        var machine = AWFYMaster.machines[id];
        var li = $('<li></li>');
        var a = $('<a href="#"></a>');
        a.click((function (id) {
            return (function (event) {
                this.changeMachine(parseInt(id));
                $('.clicked').removeClass('clicked');
                $(event.target).addClass('clicked');
                return false;
            }).bind(this)
        }).bind(this)(id));
        if (parseInt(id) == this.machineId)
            a.addClass('clicked');
        a.html(machine.description);
        a.appendTo(li);
        li.appendTo(menu);
    }

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

    var about = $('#aboutdrop');
    about.click((function (event) {
        var help = $('#about');
        if (!help.is(':visible')) {
            $('.graph-container').hide();
            help.show();
            about.text('Home');
        } else {
            help.hide();
            $('.graph-container').show();
            about.text('About');
        }
        menu.hide();
        return false;
    }));
}

