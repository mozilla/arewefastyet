// vim: set ts=4 sw=4 tw=99 et:
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

    var ruler = $('<div class="tooltipRuler"></div>');
    ruler.appendTo(this.elt);

    var button = $('<a class="closeButton" href="#"></a>');
    button.text('[x]');
    button.appendTo(this.elt);
    button.css('text-decoration', 'none');
    button.click(this.remove.bind(this));

    var span = $('<span>' + this.contents + '</span>');
    span.appendTo(this.elt);

    this.draw();
    this.elt.draggable({ drag: this.onDrag.bind(this) });
}

ToolTip.prototype.drawBasic = function () {
    var text = '<div class="tooltip">' + this.contents + '</div>';
    this.elt = $(text);
    this.draw();
}

ToolTip.prototype.draw = function () {
    var tipWidth = 165;
    var tipHeight = 75;
    var xOffset = 5;
    var yOffset = 5;

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

ToolTip.prototype.remove = function () {
    if (this.svg)
        this.svg.remove();
    this.elt.remove();
}

ToolTip.prototype.midpoint = function () {
    var offset = this.elt.offset();
    var width = this.elt.width();
    return { x: offset.left + width / 2, y: offset.top };
}

ToolTip.prototype.onDrag = function (event, ui) {
    if (!this.line)
        return;
    this.line.setAttribute('x2', this.midpoint().x);
    this.line.setAttribute('y2', this.midpoint().y);
    this.svg.height($('body').height());
}

ToolTip.prototype.attachLine = function (color) {
    // Now overlay a line from the point to the tooltip, ya.
    var ns = "http://www.w3.org/2000/svg";

    var svg = $(document.createElementNS(ns, 'svg'));
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

    svg.height($('body').height());
    svg.appendTo('body');
    this.svg = svg;
    this.line = line;
}

