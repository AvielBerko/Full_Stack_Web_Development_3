/*
This module holds utility functions used accross the site.
*/

/**
* This function generates a uniqe UUID for saving items in the database.
* @returns Uniqe UUID.
*/
function generateUUID() {
    const data = new Uint32Array(4);
    crypto.getRandomValues(data);
    return `${data[0].toString(16).padStart(8, '0')}-${data[1].toString(16).padStart(4, '0')}-${data[2].toString(16).padStart(4, '0')}-${data[3].toString(16).padStart(4, '0')}-${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')}`;
}

/*
    * If the checkbox to keep logged in is checked, the function saves the
    * username in cookies, so next time the website will auto login.
 */
function setAutoLogin(apiKey) {
    const expires = new Date();
    expires.setDate(expires.getDate() + LOGIN_COOKIE_DAYS);
    setCookie(APIKEY_COOKIE_NAME, apiKey, expires);
}
