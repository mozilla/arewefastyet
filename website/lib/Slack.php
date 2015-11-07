<?php

class Slack {
	// (string) $message - message to be passed to Slack
	// (string) $icon - You can set up custom emoji icons to use with each message
	public static function log($message, $icon = ":longbox:")
	{
		global $config;

		$data = "payload=" . json_encode(array(
				"text"          =>  $message,
				"icon_emoji"    =>  $icon
			));
	   
		// You can get your webhook endpoint from your Slack settings
		$url = $config->slack_webhook;
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$result = curl_exec($ch);
		curl_close($ch);
	   
		return $result;
	}
}
