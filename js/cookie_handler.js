/*
This module is for handling cookies in our site (set, get, reset).
*/
function setCookie(name, value, max_age) {
    const cookie = `${name}=${value}; max-age=${max_age}; path=/;`;
    document.cookie = cookie;
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function resetCookie(name, value, max_age) {
    if (getCookie(name)) {
        setCookie(name, value, max_age);
    }
}

function removeCookie(name) {
    setCookie(name, 0, 0);
}