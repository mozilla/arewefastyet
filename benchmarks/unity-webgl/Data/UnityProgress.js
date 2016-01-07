function UnityProgress (dom, args) {
	this.progress = 0.0;
	this.message = "";
	this.dom = dom;

	var parent = dom.parentNode;

	var background = document.createElement("div");
	if (args.backgroundcolor)
		background.style.background = "#"+args.backgroundcolor;
	else
		background.style.background = "#ffffff";
	background.style.position = "absolute";
	parent.appendChild(background);
	this.background = background;

	var logoImage = document.createElement("img");
	if (args.logoimage)
		logoImage.src = args.logoimage; 
	else
		logoImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHoAAAAoCAYAAAAxH+4YAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAADIxJREFUeNrsXAtUlHUWv/MChhnQ4aUDIggC8vI1KZKuYam5KVumuJ2go6cS02x7mFYm5qNt4WRKbZtp57TVHsvHOZ21UmKBFRFkBUkNeSMLgoDyhhlmeMyw9/7ho48ENGRgZOee84fv/fr97+/+7v3+3wi6urqAZxbYgrFNxeaCTQhmu5/MgO0GtmJs6djauRUCHtDu2B7HpjA/rzFhDdhOYivlA+2L7Y+meLU6nU5o0OsF1jKZ3ozdkOwYtjwx/pFiW2lS4Gq1wvPnzzuXlZV5NDY1uctlsivrIyOvmDEbkhG2peKemGwxmleiVqtFP1+5Yl9QUOBy69Ytt6bmJhdc5qBuUUOrVgsuSmUbbmYGemjGdBcB7T0aZ8/Pz7e9evXqxPLycncE1+fmzZuK1tZWQVtbG3R0dACFFJFICAKBEFrUarecnBwbf3//FjNuQzJvAtpxJM/4988/n5afXzC/pvaWo0atsSSPbW/vFocCgYD9Fwm7xb5eb0DA9Qh0i/RiZqbSDPSQbTwBLRqps2HMlX733XfLNRqNXK9HbYW4dhm6QG/QM1AtJBIYP348eTB0Yy5g/5HGIS8vbxIuKDRjNiSzEo/k2Q59+qmquaVF3qbTgcFgAJFYDCi0YMKECeDm7g4B/gGQ/p90yMjIAIlYAgb0ZpFIjNt2QUVFxaTOzk6BWCzuMuP2281oQNfX10vSz593pWmJRGK4ceOGdWpa2gKKuy4uLuDj4wPe3t6sEchOTk5QXFwMH370EesE7R1tMG4cendzM+iRymtqayYUFhbK/fz8zPRtKkBXVt6wemfnO6uqqqumEiWTwJqAQD737LMM2MmTJ4O9gwNYWVn9UtJBcA8cOADNzU0sRgcEBEBoaCjs27ePebXeYLBOTEiYjEDnmMKDq6ystEpNTXXm5tesWVPyfwV0XV2dZMfbO1YXFRd76pCiCWQHB3uIjIyERQ8/POB+8fHxkJycDNZSKWhxv9VhqyEkZBF8cvAggt+MOYIFoCCj0qxJAE0gR0dHP8MDercpAy0cbpDf2LZtNaZOnlqmpttALpfDjh1Rg4Lc2NgIu3btgqqqKigtK4OZM2fCsmW/R+oex2herdEAxmeoqq5WIpWL4T4x8vrLly8rxpRHYx5s+eabb65BdexBntzY1Ag2chvYvXs3PDwIyGQxMTFMgLHUSiSCjRs3gqWlJZufNWsWfPPNNyBD0WZjY2OflZWlCFm0qMaUAUb2WnHx4kUVTS9fvjwRO27amACaQN6yZcsqvDmP2ro6aEIPdXR0hD/HvgtLliwZdN/S0lI4/NlnIESADZhyPYtxfMGCBb3rFy9eDBYWFizFwiZOTEycZApAo9ZoIBD7W1dbW2tyL4buGWi8KYv1658PO5Oc7EklSzIC+VOMrX94/PE77h8VFQX12DnIk11dXWH79u191k+bNo0JuOzsbBBjynXhwgV3XHxptB8cemmDKXjqiADd1NQkjggPX5OQlORJ3kiVLWdnZ/jqq6/uSNdk6enpcOz4cZBaWwPF9E1I2e7u7n0zfVTmDzzwAAPawtKiC70ojxS6UDiwvHj11VcXl5WVKWk6ODg4d+vWrVncuoSEBOXBgwcXc/PffvvtP/jLnnrqqTRklMojR474Y3z1wDRRgYylxFy/6oknnkjdsGFD7kDHef/991V4T36oNZx5ok315JNPetC0m5tbVU/hqN9r4yw8PDwMn4cVdz3DoejF90LX69auXZV05oynEAEWI71SfZpAwQcEGEvZPJW2BPwduTInevDJkycZYFQl+x3S9aYXX+z3XETfX375JcybOzf36aefvuNN04PEkMAerr+/f5/tGxoapNy6/pYheApU04p+7lf5xRdfhAYFBVWRN/d3HMwOrH69DJ1BQY0DGsWp9lfb9AGaOhDqHD9uHjvdiVHz6JqaGouIiIjVqWlpUwk2qnCRNxNop+PiGIC/AAvsxUQ3xj2g94BN3iqTWbPy55bXXgNbW9t+zxcSEgIBgYFq7P3n7OztOwbz5ns1DpT+DFNFKwTCA4HO6m89Xr8OGamEPJq2pWWYOTQoFAoaBEBsR3RfeerUKU6feJAyx+U67hgpKSm9ncDX1zeXv27Egda2toradLp2omuxRALk0dADtLhnxApN84EV9DTOqwXdFTPcTsQ6wnjFwPqFFLhELBbR/iNRAiVw0JOyVq1alevk5KRFKo3kOgB57UD79dBwFlL1M5zX0nH27t3bJ5a/9957DdzxKETw6RsFrT9PBwxbEWZIQCvs7Nr/9skn8ai0O8+np0/nQCWqDnnoIXB3c2Mxl/Nc7gUFz8lZB7mI9I40C3rMkakqtnDhwl86A8/OpqRAXkGBdP/+/Y88umzZ18YG+syZMx/1uV/0yME8fQhCLvfs2bPzabqoqEjJLaecm0IEL1bnjCrQmM/qPTw8NDHR0f9+6623BBcyMwMJIBJJldVVsGfPHpg1cybo2tq6d+i63QnRMyHuxzjY8MIL6LEyOJeaykTc2rVrb9v2XMo5GvMEufn5Xh/Gxvq9/Morufdz3fmxxx7L4YBGkUke/ENPfO6lbRJ/w0Xb91QZk8lkem8fH/W+Dz5ImDtnTg6JK6LY/5aUwOaXXoLikmusyMGaXH5bs8T4vGJFKDy69FHo7Ohg+yJLUIzscx6qiF2+chmsMZYTYyQmJfnAfW5LliypovDAxf3jx4979Hh0L9Aoaoe11HtPqobAnjJlSmvsgQM/Bs2dm01gy21soKCwECIinoGCgoLB6QS9euvrr4O9vT0rihCN70cK59v169fZcisrKXvZERwUVAJjwLy8vEp4aSYDmK+2SR+YVK2bwJ7s5qbdu2dPkmr27GwRiqtxCDYB9Nzzz0NJyeC4BE6fDitXrmQvP2zQ048fO8ZeV/LiJWg0Gibc0Os7ZqtUN8cC0CqVqoQXm/0OHTrkx6dtSuFMCmg+jb+7d2/SjOnTr5Jn29jIGY2vX7+elTkHrQ3jNt5eXmxao2mFv378MXDjzZPPnmXeTsd0cHCow47R+FuuTa1WS7lpephHjx6dbwpAU+EFO66OS+ni4+NVxqLtYQOaA3uql5caBdq/fKdNyxUysG2hsKgINm7aBOXl5QPuSwMPSIR1Yromt5HBD99/TxUlNkiwCMOAFOM5DViY7OpaqVQq7yhQpFJp7zYkeijdCQ4OfgOBDvt1QcMYxj9/YmLigqioqPlUraNiSB82CwzsBZR/XcNN28MKdG/MRjX+l+jo+EA//58JHCqC5Ofnd23evJmVMUlc9WdhYWEwLygIhVkn897Dnx2GtLQ0aGhsBAl6NOXaDz74YPHdFEswI6jkz9ND5AoYI1QHL+EXWU6dOrWYOhxStPNA9M3P4Yebtu+51j1AbzZQ6rVt27bkjIyMvJ7iSRfGWXFkZORS9EhbX19fmDFjBnsF6enpyYormLIBdQZKt6gAk/1zNsTGxrIBgwJcb2VpqZ4XHFx9N9dABYqcnBwPvpf0PMBcSm1OnDih4l4jGsOoAFJZWangUih+iZQ/HxoaWoIsc1uObYxrok9ydhnjwAisiAbzMaB7iiA7d+6cF5+Q8EhnezsYMAbTiE96MzUdBRkNNqBxZB9jfI6Li0MvloC+U8+UOeXoyokTS458/fVRhULRcbfXQAWIwsJCxWgN8+EPNxrsGhYtWvQnriATExNzmNIvk/doPo3z56mYsm7duuyMzMxZOp3OztBlwBjcDpcuXYKMzAwgtW5npwCFwg4saNABdgSJBC+vq7tGPsXdveK3gNzjHUahwbs1KnjcqZNR3OZAJtYxBsjDHqMHPRHSL4m1iPDweI8pU7LlMlktAYhUz2jb2tqaKe7y8uu9hVImvGnsN3YKVNs3YAza6dOn/Y1N20b16P4M0wnD6rCw0qVLl1Zgni376aefnIqKiuizHGV9fb2jVqezFQjF3SVTAVc5FdB+LXPmzLk1FoGmHJpfGjUm0JQKjIgipTdPjo6O7UTBE5XKttkqVUNra2txXW2tRUVFhYw+u8nNy5tUffOmsqWlxQ5jvCUxgYuz8/WAwMDmsQbySNE2WjuJsRdwYuJo3jCJNq1WK8T/QgReVIUi5tq1a7b5eXkOV3Ny3FChl25/++1LxnwPPcatmoCmMT8LTeWKSLR1dHQI29vahDps6pYWFl4mubpqJRKJ+XOcoVkKAS3DiZdhlL+RNpvRjD5V/ZC4UIPtn+bnMWaNsNXwf6zGE9sKMP9YzVgxqh/Q4DT2KlDQz89PUdmO+/kps91/xv38VBrwfn7qfwIMAHktq8bcYvfUAAAAAElFTkSuQmCC";
	logoImage.style.position = "absolute";
	parent.appendChild(logoImage);
	this.logoImage = logoImage;

	var progressFrame = document.createElement("img");
	if (args.progressframeimage)
		progressFrame.src = args.progressframeimage; 
	else
		progressFrame.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAAGCAYAAADpJ08yAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAB5JREFUeNpi/P//fwMDEDAxQAEeBmNoaOhNEAMgwADBCwVgaIqyZQAAAABJRU5ErkJggg==";
	progressFrame.style.position = "absolute";
	parent.appendChild(progressFrame);
	this.progressFrame = progressFrame;

	var progressBar = document.createElement("img");
	if (args.progressbarimage)
		progressBar.src = args.progressbarimage; 
	else
		progressBar.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHoAAAAGCAIAAACD2x0JAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACVJREFUeNpiNDQ0ZBgF9AJMo0EwGtyjwT0KRoN7NLhHAT4AEGAAK8kAn2rIe4AAAAAASUVORK5CYII=";
	progressBar.style.position = "absolute";
	parent.appendChild(progressBar);
	this.progressBar = progressBar;

	var messageArea = document.createElement("p");
	messageArea.style.position = "absolute";
	parent.appendChild(messageArea);
	this.messageArea = messageArea;


	this.SetProgress = function (progress) { 
		if (this.progress < progress)
			this.progress = progress; 
		this.messageArea.style.display = "none";
		this.progressFrame.style.display = "inline";
		this.progressBar.style.display = "inline";			
		this.Update();
	}

	this.SetMessage = function (message) { 
		this.message = message; 
		this.background.style.display = "inline";
		this.logoImage.style.display = "inline";
		this.progressFrame.style.display = "none";
		this.progressBar.style.display = "none";			
		this.Update();
	}

	this.Clear = function() {
		this.background.style.display = "none";
		this.logoImage.style.display = "none";
		this.progressFrame.style.display = "none";
		this.progressBar.style.display = "none";
	}

	this.Update = function() {
		this.background.style.top = this.dom.offsetTop + 'px';
		this.background.style.left = this.dom.offsetLeft + 'px';
		this.background.style.width = this.dom.offsetWidth + 'px';
		this.background.style.height = this.dom.offsetHeight + 'px';

		var logoImg = new Image();
		logoImg.src = this.logoImage.src;
		var progressFrameImg = new Image();
		progressFrameImg.src = this.progressFrame.src;

		this.logoImage.style.top = this.dom.offsetTop + (this.dom.offsetHeight * 0.5 - logoImg.height * 0.5) + 'px';
		this.logoImage.style.left = this.dom.offsetLeft + (this.dom.offsetWidth * 0.5 - logoImg.width * 0.5) + 'px';
		this.logoImage.style.width = logoImg.width+'px';
		this.logoImage.style.height = logoImg.height+'px';

		this.progressFrame.style.top = this.dom.offsetTop + (this.dom.offsetHeight * 0.5 + logoImg.height * 0.5 + 10) + 'px';
		this.progressFrame.style.left = this.dom.offsetLeft + (this.dom.offsetWidth * 0.5 - progressFrameImg.width * 0.5) + 'px';
		this.progressFrame.width = progressFrameImg.width;
		this.progressFrame.height = progressFrameImg.height;

		this.progressBar.style.top = this.progressFrame.style.top;
		this.progressBar.style.left = this.progressFrame.style.left;
		this.progressBar.width = progressFrameImg.width * Math.min(this.progress, 1);
		this.progressBar.height = progressFrameImg.height;

		this.messageArea.style.top = this.progressFrame.style.top;
		this.messageArea.style.left = 0;
		this.messageArea.style.width = '100%';
		this.messageArea.style.textAlign = 'center';
		this.messageArea.innerHTML = this.message;
	}

	this.Update ();
}