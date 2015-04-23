<?php

/**
 * Verification library for the BrowserID / Persona authentication system
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @category Auth
 * @package Auth_BrowserID
 * @author Francois Marier <francois@mozilla.com>
 * @copyright 2013 Mozilla Foundation
 * @license http://mozilla.org/MPL/2.0/
 * @link http://pear.php.net/package/Auth_BrowserID
 * @since File available since Release 0.1.0
 */

class Auth_BrowserID
{
    /**
     * Scheme, hostname and port
     */
    protected $audience;

    /**
     * Verification type: 'local' or 'remote'
     */
    protected $type;

    /**
     * URL of the remote verifier
     */
    protected $verifierUrl;

    /**
     * Constructor
     *
     * @param string $audience The scheme, hostname and port of the server
     * @param string $type The type of verification ('local' or 'remote')
     * @param string $verifierUrl The URL to use for remote verification
     */
    public function __construct($audience, $type = 'remote', $verifierUrl = 'https://verifier.login.persona.org/verify')
    {
        $this->audience = $audience;
        $this->type = $type;
        $this->verifierUrl = $verifierUrl;
    }

    /**
     * Verify the validity of the assertion received from the user
     *
     * @param string $assertion The assertion as received from the login dialog
     * @param boolean $type The type of verification ('local' or 'remote')
     * @return object The response from the Persona online verifier
     */
    public function verifyAssertion($assertion)
    {
        if ($this->type === 'local') {
            return $this->verifyLocally($assertion);
        } else {
            return $this->verifyRemotely($assertion);
        }
    }

    /**
     * Contact the identity provider directly when verifying the
     * validity of the assertion.
     *
     * @param string $assertion The assertion as received from the login dialog
     * @return object The response from the Persona online verifier
     */
    private function verifyLocally($assertion)
    {
        // Mozilla currently recommends against local verification
        // since the details of the certificate format are not yet finalized and
        // may change.
        throw new Exception("Not implemented.");
    }

    /**
     * Use the verification service at verifier.login.persona.org to
     * verify the validity of the assertion.
     *
     * @param string $assertion The assertion as received from the login dialog
     * @return object The response from the Persona online verifier
     */
    private function verifyRemotely($assertion)
    {
        $postdata = 'assertion=' . urlencode($assertion) . '&audience=' . urlencode($this->audience);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->verifierUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response);
    }
}
