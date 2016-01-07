// API:
//
// postScreenshot('caption', screenshotData)
//   caption: A string describing the screenshot.
//            If undefined, false or null, will be omitted.
//   screenshotData: Binary (form data) screenshot data to send.
//            If undefined, false, or null, will be replaced
//            with a picture of lederhosen-clad men dancing.
//            So don't omit this, mmkay?
//
// REMEMBER TO CHANGE THE APPID TO PRODUCTION WHEN THIS IS READY TO GO PUBLIC
//
// NOTE: Currently, you _must_ be an administrator or tester of the test app
// in order for this to work. You will see a big scary red permissions dialogue.
// That's expected and OK! If you are a tester, it will still work. JUST CLICK THROUGH.

var appId = 305812776265197; // PRODUCTION APP
var openGraphId = 'unity-webgl-bench';

//var appId = 305812959598512; // TEST APP
//var openGraphId = 'unity-webgl-bmtest';

var locale = 'en_US';

window.fbAsyncInit = function() {
	FB.init({
		appId      : appId,
		cookie     : true,
		xfbml      : false,
		version    : 'v2.0'
	});
};

function onLoginFailure() {
// Implement your failed-to-login code here
};

postScreenShotData = {};

doPostScreenshot = function(score, browserString, imageData) {

	var postOpenGraphStory = function(imageUrl) {
		// Create a benchmark object...
		console.log('creating opengraph object for browser ' + browserString);
		var benchmarkObj = {
			'app_id': appId,
			'title': browserString,
			'image': imageUrl,
			'data': {
				'score': score
			}
		};

		FB.api(
			'me/objects/' + openGraphId + ':benchmark',
			'post',
			{
				object: JSON.stringify(benchmarkObj),
			},
			function(response) {

				if(response && response.id) {
					// If we succeeded, pop up standard Facebook share dialog
					FB.ui({
						method: 'share_open_graph',
						action_type: openGraphId + ':finish',
						action_properties: JSON.stringify({
						      benchmark: response.id
						})
					});
				}
				else {
					// Log errors
					console.log(response);
				}
			}
		);
	};

	var _sendScreenshot = function() {
		var blob = new Blob([imageData], {type: 'image/png'});

		var formData = new FormData();

		formData.append('file', blob);

		var xhr = new XMLHttpRequest();
		xhr.open( 'POST', 'https://graph.facebook.com/me/staging_resources?access_token=' + FB.getAccessToken(), true );
		xhr.onload = function() {
	  		document.getElementById("loadingimage").style.visibility = "hidden";
			var responseObj = JSON.parse (xhr.responseText);
			if (responseObj && responseObj.uri)
			{
				postOpenGraphStory(responseObj.uri);
			}
		};

		xhr.onerror = function() {
			console.log( xhr.responseText );
	  		document.getElementById("loadingimage").style.visibility = "hidden";
		};

		xhr.send(formData);
	}; // END: _sendScreenshot function

	// Async JS Flow:
	// - Get Login Status
	// - If logged in, send screenshot via curried function
	// - Else, request login
	// -- If login succeeds, send screenshot via curried function
	// -- Else, call error callback
	document.getElementById("loadingimage").style.visibility = "visible";
	FB.getLoginStatus(function(response) {
	  if (response.status === 'connected') {
		_sendScreenshot();
	  }
	  else {
		FB.login(function(loginResponse) {
		  if(loginResponse === 'connected') {
			_sendScreenshot();
		  }
		  else {
	  		document.getElementById("loadingimage").style.visibility = "hidden";
			onLoginFailure();
		  }
		}, {scope: 'publish_actions'});
	  }
	});
}

var screenShotData;
var screenShotScore = 0;

window.setupPostScreenshot = function(score, data)
{
	screenShotScore = score;
	screenShotData = data;
}

window.postScreenshot = function() 
{
	if (screenShotScore == 0)
		return;
    var browser = (function(){
        var ua= navigator.userAgent, tem, 
        M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if(/trident/i.test(M[1])){
            tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
        }
        if(M[1]=== 'Chrome'){
            tem= ua.match(/\bOPR\/(\d+)/)
            if(tem!= null) return 'Opera '+tem[1];
        }
        M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
        if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    })();

    doPostScreenshot(screenShotScore, browser, screenShotData);
};

(function(d, s, id){
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement(s); js.id = id;
	js.src = 'http://connect.facebook.net/' + locale + '/sdk.js';
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));