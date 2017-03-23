
function init_schedule() {
	var html = "<select onchange='init_recipe(this.value)'>";
	html += "<option value='-1'>---</option>";
	for (var i = 0; i < recipes.length; i++) {
		html += "<option value='"+i+"'>"+recipes[i]["name"]+"</option>";
	}
	html += "</select>";
	html += "<div id='recipe_content'></div";
	document.getElementsByClassName("dashboard_content")[0].innerHTML = html;
}

function init_recipe(id) {
	var html = "<p>"+recipes[id]["description"]+"</p>";
	html += "<input type='hidden' name='task' value='"+recipes[id]["id"]+"'>";
	html += "<textarea disabled cols=100 rows=5>"+recipes[id]["task"]+"</textarea><br/>";

	var inputs = recipes[id]["inputs"]
	for (var i = 0; i < inputs.length; i++) {
		var id = inputs[i]["id"]
		if (inputs[i]["type"] == "alphanum") {
			html += inputs[i]["name"]+": <input name='"+id+"' type='text' value='' /><br />";
		} else if (inputs[i]["type"] == "select") {
			html += inputs[i]["name"]+": ";
			html += "<select name='"+id+"'>";
			for (var j = 0; j < inputs[i]["options"].length; j++) {
				html += "<option>"+inputs[i]["options"][j]+"</option>";
			}
			html += "</select><br />";
		}
	}
	html += "Email results: <input name='email' type='checkbox' checked><br />";
	html += "<input type='submit' value='schedule'>";
	document.getElementById('recipe_content').innerHTML = html;
}
