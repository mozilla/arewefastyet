<?php

if (isset($_POST['idtoken'])) {
	$json = file_get_contents("https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=".$_POST['idtoken']);
	$obj = json_decode($json);
	echo $obj->email;

	session_start();
	$_SESSION["persona"] = $obj->email;
	setcookie ("persona", $obj->email, 0, "/");
	exit();
}

if (isset($_GET['check'])) {
	session_start();
	echo isset($_SESSION['persona'])?$_SESSION['persona']:"";
	exit();
}
