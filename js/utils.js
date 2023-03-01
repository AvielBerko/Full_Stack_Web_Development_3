/*
This module holds utility functions used accross the site.
*/

/**
* This function generates a uniqe UUID for saving items in the database.
* @returns Uniqe UUID.
*/
function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
        const random = (Math.random() * 16) | 0;
        const value = character === "x" ? random : (random & 0x3) | 0x8;
        return value.toString(16);
    });
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
