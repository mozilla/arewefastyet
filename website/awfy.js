// vim: set ts=4 sw=4 tw=99 et:
"use strict";
var AWFY = { };

AWFY.refreshTime = 1000 * 60 * 5;
AWFY.machineId = 0;
AWFY.refresh = true;
AWFY.panes = [];
AWFY.queryParams = { };
AWFY.drawLegend = function () {
}

AWFY.onQueryFail = function () {
    if (this.refresh)
        window.setTimeout(this.query.bind(this), this.refreshTime);
}

AWFY.compute = function (xhr) {
    var blob = JSON.parse(xhr.responseText);

    // :TODO: handle version changes better.
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

    var data = { graphs: graphs };

    // Everything built successfully, so now we can send this to be drawn.
    for (var i = 0; i < this.panes.length; i++) {
        var id = this.panes[i];
        var elt = $('#' + id + '-graph');
        var graph = data.graphs[id];
        var display = new Display(this, elt, data, graph);
        display.draw();
    }

    if (this.refresh)
        window.setTimeout(this.query.bind(this), this.refreshTime);
}

AWFY.query = function(name, callback) {
    var url = window.location.protocol + '//' +
              window.location.host +
              window.location.pathname;
    if (url[url.length - 1] != '/')
        url += '/';
    url += 'data/' + name;

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4)
            return;

        if (xhr.status != 200) {
            AWFY.onQueryFail();
            return;
        }

        callback(xhr);
    };
    xhr.open('GET', url, true);
    xhr.send();
}

AWFY.onGraphHover = function (event, pos, item) {
    var elt = $(event.target);
    var display = elt.data('awfy-display');
    display.onHover(event, pos, item);
}

AWFY.onGraphClick = function (event, pos, item) {
    var elt = $(event.target);
    var display = elt.data('awfy-display');
    display.onClick(event, pos, item);
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

    for (var i = 0; i < this.panes.length; i++) {
        var id = this.panes[i];
        $('#' + id + '-graph').bind("plothover", this.onGraphHover.bind(this));
        $('#' + id + '-graph').bind("plotclick", this.onGraphClick.bind(this));
    }

    this.query('aggregate-' + this.machineId + '.json', this.compute.bind(this));
}

