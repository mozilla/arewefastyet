
function onSignIn(googleUser) {
  var id_token = googleUser.getAuthResponse().id_token;

  //var profile = googleUser.getBasicProfile();
  //console.log('Email: ' + profile.getEmail());
  var url = window.location.origin + "/auth.php";

  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function() {
    console.log('Signed in as: ' + xhr.responseText);
  };
  xhr.send('idtoken=' + id_token);
}

var currentUser;
gapi.load('auth2', function(){
	gapi.auth2.init({
			client_id: '426737155695-li9p5ukm79p60loe0p27g9p2m5299mko.apps.googleusercontent.com'
	});
});
