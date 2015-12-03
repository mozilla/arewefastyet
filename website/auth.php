<?php

// Demo site using Auth_BrowserID for authentication

if(isset($_GET['persona'])) {
  require_once 'BrowserID.php';
  
  // Login
  if(isset($_GET['assertion'])) {
    if ($_SERVER['HTTP_HOST'] == "www.arewefastyet.com")
      $verifier = new Auth_BrowserID('https://www.arewefastyet.com');
    else
      $verifier = new Auth_BrowserID('https://arewefastyet.com');
    $result = $verifier->verifyAssertion($_GET['assertion']);

    if ($result->status === 'okay') {
      session_start();
      $email = htmlentities($result->email, ENT_QUOTES);
      $_SESSION["persona"] = $email;
      setcookie ("persona", $email, 0, "/");
    }
  }
  
  // Logout
  if(isset($_GET['logout'])) {
    session_start();
    unset($_SESSION['persona']);
    setcookie ("persona", "", 1, "/");
  }

  if(isset($_GET['check'])) {
    session_start();
    echo isset($_SESSION['persona'])?$_SESSION['persona']:"";
    exit();
  }
  
  echo "<script>history.back();</script>";
  exit();
}


// Now you can use $_SESSION['persona'] to check if people is logged in. It is a email adress.
