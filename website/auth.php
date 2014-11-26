<?php
session_start();

// Demo site using Auth_BrowserID for authentication

if(isset($_GET['persona'])) {
  require_once 'BrowserID.php';
  
  // Login
  if(isset($_GET['assertion'])) {
	if ($_SERVER['HTTP_HOST'] == "www.arewefastyet.com")
		$verifier = new Auth_BrowserID('http://www.arewefastyet.com');
	else
		$verifier = new Auth_BrowserID('http://arewefastyet.com');
    $result = $verifier->verifyAssertion($_GET['assertion']);

    if ($result->status === 'okay') {
      $_SESSION["persona"] = $result->email;
      setcookie ("persona", $result->email, 0, "/");
    }
  }
  
  // Logout
  if(isset($_GET['logout'])) {
    unset($_SESSION['persona']);
    setcookie ("persona", "", 1, "/");
  }
  
  echo "<script>history.back();</script>";
  exit();
}


// Now you can use $_SESSION['persona'] to check if people is logged in. It is a email adress.
