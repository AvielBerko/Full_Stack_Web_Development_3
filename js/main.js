/*
This module handles the main page, and the cookies for auto-logout.
*/
const signup = document.getElementById('signup-b');
const login = document.getElementById('login-b');
const gameLinks = document.getElementsByClassName('game-link');

const COOKIE_TIMEOUT = 3 * 60; // 3 minutes
// import {setCookie, getCookie} from './cookie_handler.js';

let active_user = JSON.parse(localStorage.getItem('active_user'));

if (active_user != null) {
    signup.innerHTML = 'Logged in as: ' + active_user;
    signup.href = './stats.html'
    signup.parentElement.classList.remove('button_user');
    signup.parentElement.classList.add('logged_info')
    login.innerHTML = 'Logout';
    login.style.background = 'black';
    setCookie('user', active_user, COOKIE_TIMEOUT)
}

// add an event listener to the sign up link to handle the click
login.addEventListener('click', () => loginout());

signup.addEventListener('click', () => load_login_page(false));

function load_login_page(login_1_signup_0) {
    localStorage.setItem('login_1_signup_0', JSON.stringify(login_1_signup_0));
    location.replace('login.html');
}

for (const link of gameLinks) {
    link.addEventListener('click', () => {
        if (active_user != null) {
            location.replace(link.id.replace('-link', '') + '.html');
        }
        else {
            localStorage.setItem('redirect', JSON.stringify(link.id.replace('-link', '') + '.html'));
            localStorage.setItem('login_1_signup_0', JSON.stringify(true));
            location.replace('login.html')
        }
    });
}

function checkCookie() {
    if (active_user) {
        user = getCookie('user');
        if (!user) {
            loginout(); // logout if cookie doesn't exist but user is active
        }
    }
    else {
        setCookie('user', null, 0);  // remove the cookie
        clearInterval(checkCookie);
    }
}

// Check the cookie regularly to see if it has expired
setInterval(checkCookie, 30 * 1000);

document.addEventListener("click", () => resetCookie('user', active_user, COOKIE_TIMEOUT));
document.addEventListener("keyboard", () => resetCookie('user', active_user, COOKIE_TIMEOUT));
document.addEventListener("scroll", () => resetCookie('user', active_user, COOKIE_TIMEOUT));
document.addEventListener("DOMContentLoaded", () => resetCookie('user', active_user, COOKIE_TIMEOUT));