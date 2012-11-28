/* vim: set ts=4 sw=4 tw=99 et: */

function NavBar(name)
{
    var timeout = 200;
    var closeTimer = null;

    function open() {
	cancel();
        close();
	$(this).addClass('active');
    }

    function close() {
	$('#' + name + ' > li').removeClass('active'); // make sure all others are closed
    }

    function timer() {
        closeTimer = window.setTimeout(close, timeout);
    }

    function cancel() {
        if (closeTimer) {
            window.clearTimeout(closeTimer);
            closeTimer = null;
        }
    }

    $('#' + name + ' > li').bind('mouseover', open);
    $('#' + name + ' > li').bind('mouseout', timer);
    $('#' + name + ' > li').bind('onclick', open);
    document.onclick = close;
}
