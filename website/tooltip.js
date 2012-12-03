// vim: set ts=4 sw=4 tw=99 et:
"use strict";

function ToolTip(x, y, item, contents)
{
    this.x = x;
    this.y = y;
    this.item = item;
    this.contents = contents;
}

ToolTip.prototype.drawFloating = function () {
    var text = '<div class="tooltip closeable"></div>';
    this.elt = $(text);

    var button = $('<a class="closeButton" href="#"></a>');
    button.text('[x]');
    button.appendTo(this.elt);
    button.css('text-decoration', 'none');
    button.click((function () {
        this.remove();
        return false;
    }).bind(this));

    var span = $('<div class="tiptext">' + this.contents + '</div>');
    span.appendTo(this.elt);

    this.draw(true);
    this.elt.mousedown(
        (function (event) {
            if ($(event.target).hasClass('tiptext') ||
                $(event.target).parents('.tiptext').length)
            {
                return;
            }
            var x = event.clientX - parseInt(this.elt.css('left'));
            var y = event.clientY - parseInt(this.elt.css('top'));
            $('html').mousemove(
                (function (event) {
                    this.elt.css({ left: (event.clientX - x) + 'px',
                                   top: (event.clientY - y) + 'px'})
                    this.onDrag(event);
                }).bind(this));
            event.preventDefault();
        }).bind(this));
    $('html').mouseup(function () {
        $('html').unbind('mousemove');
        });

    // Re-orient the box so it looks like it's directly underneath the point.
    var width = this.elt.width();
    var x = this.x - width / 2;
    this.elt.css({ left: x });
}

ToolTip.prototype.drawBasic = function () {
    var text = '<div class="tooltip">' + this.contents + '</div>';
    this.elt = $(text);
    this.draw(false);
}

ToolTip.prototype.draw = function (expanded) {
    var tipWidth = 165;
    var tipHeight = 75;
    var xOffset = -10;
    var yOffset = 15;

    var ie = document.all && !window.opera;
    var iebody = (document.compatMode == 'CSS1Compat')
                 ? document.documentElement
                 : document.body;
    var scrollLeft = ie ? iebody.scrollLeft : window.pageXOffset;
    var scrollTop = ie ? iebody.scrollTop : window.pageYOffset;
    var docWidth = ie ? iebody.clientWidth - 15 : window.innerWidth - 15;
    var docHeight = ie ? iebody.clientHeight - 15 : window.innerHeight - 8;
    var y = (this.y + tipHeight - scrollTop > docHeight)
        ? this.y - tipHeight - 5 - (yOffset * 2)
        : this.y; // account for bottom edge

    // account for right edge
    this.elt.css({ top: this.y + yOffset});

    if (this.x + tipWidth - scrollLeft > docWidth)
        this.elt.css({ right: docWidth - this.x + xOffset });
    else
        this.elt.css({ left: this.x + xOffset });

    this.elt.appendTo('body').fadeIn(200);
}

ToolTip.prototype.detach = function () {
    if (this.svg) {
        this.svg.remove();
        this.svg = null;
    }
}

ToolTip.prototype.remove = function () {
    this.detach();
    this.elt.remove();
    this.closed = true;
}

ToolTip.prototype.midpoint = function () {
    var offset = this.elt.offset();
    var width = this.elt.width();
    return { x: offset.left + width / 2, y: offset.top };
}

ToolTip.prototype.onDrag = function (event) {
    if (!this.line)
        return;
    this.line.setAttribute('x2', this.midpoint().x);
    this.line.setAttribute('y2', this.midpoint().y);
    this.svg.height(Math.max($('window').height(), $('body').height()));
    this.dragged = true;
}

ToolTip.prototype.attachLine = function (color) {
    // Now overlay a line from the point to the tooltip, ya.
    var ns = "http://www.w3.org/2000/svg";

    var svgElt = document.createElementNS(ns, 'svg');
    var svg = $(svgElt);
    svg.css({ position: 'absolute',
              left: 0,
              top: 0,
              'z-index': -1,
              overflow: 'visible'
             });
    var line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', this.item.pageX);
    line.setAttribute('x2', this.midpoint().x);
    line.setAttribute('y1', this.item.pageY);
    line.setAttribute('y2', this.midpoint().y);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', 2);
    $(line).appendTo(svg);

    svgElt.setAttribute('width', '100%');
    svgElt.setAttribute('height', '100%');
    svg.appendTo('body');
    this.svg = svg;
    this.line = line;
}

