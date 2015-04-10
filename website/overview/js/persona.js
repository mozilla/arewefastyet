
 // Listen on Persona events
var request = false;
var currentUser = decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent("persona").replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
var url = window.location.href.replace(window.location.hash, "") + "../auth.php";
navigator.id.watch({
  loggedInUser: currentUser == "" ? null : currentUser,
  onlogin: function (assertion) {
    if(request) {
      window.location = url + "?persona=1&assertion=" + assertion;
    }
  },
  onlogout: function () { 
    if(request) {
      window.location = url + "?persona=1&logout=1";
    }
  }
});

// Do login in
var doPersonaLogin = function() {
  request = true;
  navigator.id.request();
}

// Do login out
var doPersonaLogout = function() {
  request = true;
  navigator.id.logout();
}
