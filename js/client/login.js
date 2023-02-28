/*
This module handles the client's login/signup to the page.
It handles the users data in local storage and sets cookies
to block attackers.
*/


/* Name of the auto login cookie. */
const LOGIN_COOKIE_NAME = "username";

const APIKEY_COOKIE_NAME = 'apiKey';
/* Number of days until expiration of the auto login cookie. */
const LOGIN_COOKIE_DAYS = 20;
/* Postfix of cookies that track the number of attempted logins. */
const ATTEMPTS_COOKIE_POSTFIX = "_attempts";
/* Number of attempts to login allowed before getting blocked. */
const ATTEMPTS_MAX = 5;
/* Number of minutes the attempts cookie stays alive. */
const ATTEMPTS_MINUTES = 10;

class LoginPage extends Page {

    constructor() {
        super('login');
    }




    enter(...args) {
        if (!this.logout(args[0])) {
            this.autoLogin();
        }
        super.enter(...args);
        const loginForm = document.getElementById('login-form');

        loginForm.addEventListener("submit", (ev) => {
            ev.preventDefault();  // prevent the form from submitting
            this.requsetLogin();
        });

        this.loginFormElements = {
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            submit: document.getElementById('submit-button'),
        }
    }

    // onNav(ev) {
    //     return ["login", apiKey];
    // }

    /*
    * Checks if last user wanted to auto login. If they wanted, then it auto
    * logins.
    */
    autoLogin() {
        const apiKey = getCookie(APIKEY_COOKIE_NAME);

        if (apiKey) {
            const username = getCookie(LOGIN_COOKIE_NAME);
            if (username) {
                this.getin(username, apiKey);
            }
        }
    }

    /*
    * Moves to home page after successfuly logged in or registered.
    */
    getin(/*username,*/ apiKey) {
        // sessionStorage.currentUsername = username;
        this.navigate(null, apiKey);  // Move to main page
    }

    requsetLogin() {
        const credentials = {
            username: this.loginFormElements.username.value,
            password: this.loginFormElements.password.value
        };

        if (credentials.username.trim() === '' || credentials.password.trim() === '') {
            return;
        }

        const attemptsCookie = credentials.username + ATTEMPTS_COOKIE_POSTFIX;
        const attempts = parseInt(getCookie(attemptsCookie) ?? 0);

        if (attempts >= ATTEMPTS_MAX) {
            console.log("Too many attempts, try again in 10 minutes")
            return;
        }

        const request = new FXMLHttpRequest();

        request.onload = () => {
            if (request) {
                this.handleLoginResponse(request);
            }
        };

        const requestData = JSON.stringify(credentials);

        request.open('post', '/login');
        request.send(requestData);
    }

    handleLoginResponse(request) {
        if (request.status === 200) {
            console.log("Login successful!");

            this.login(request.responseText);
        } else {
            console.log("Invalid username or password");
            const username = JSON.parse(request.body)['username']
            const attemptsCookie = username + ATTEMPTS_COOKIE_POSTFIX;
            const attempts = parseInt(getCookie(attemptsCookie) ?? 0);
            if (attempts <= ATTEMPTS_MAX) {
                // Updates the the number of attempts in the attempts cookie.
                const expires = new Date();
                expires.setMinutes(expires.getMinutes() + ATTEMPTS_MINUTES);
                setCookie(attemptsCookie, isNaN(attempts) ? 1 : attempts + 1, expires);
            }
        }
    }

    login(/*username, */apiKey) {
        this.setAutoLogin(apiKey);
        this.getin(apiKey);
    }


    logoutReguest() {
        const request = new FXMLHttpRequest();
        request.onload = () => {
            let responseObject = null;

            try {
                responseObject = JSON.parse(request.responseText);
            } catch (e) {
                console.error('Could not parse JSON!');
            }

            if (responseObject) {
                this.handleLogoutResponse(responseObject);
            }
        };

        const requestData = //`apikey=${apiKey}`;

            request.open('post', '/logout');
        request.send(requestData);
    }

    handleLogoutResponse(responseObject) {
        if (responseObject.status === 200) {
            console.log("Logout successful!");
            this.logout();
        }
    }

    /*
    * Checks if the url has a parameter to logout. If it does, the function
    * logouts and removes the auto login cookie.
    * Returns `true` if logged out. Otherwise, returns `false`.
    */
    logout() {
        sessionStorage.removeItem('currentUsername');
        removeCookie(LOGIN_COOKIE_NAME);
        return true;
    }

    /*
    * If the checkbox to keep logged in is checked, the function saves the
    * username in cookies, so next time the website will auto login.
    */
    setAutoLogin(apiKey) {
        const keepLoggedIn = document.getElementById("chkAutoLogin").checked;
        if (keepLoggedIn) {
            const expires = new Date();
            expires.setDate(expires.getDate() + LOGIN_COOKIE_DAYS);
            setCookie(APIKEY_COOKIE_NAME, apiKey, expires);
        }
    }

}



// const signupLink = document.getElementById('signup-link');
// signupLink.addEventListener('click', (event) => {

// });


// ################################ VALIDATION ################################
document.addEventListener('DOMContentLoaded', () => {
    var input100 = document.querySelectorAll('.input100');
    input100.forEach(function (input) {
        input.addEventListener('blur', function () {
            if (input.value.trim() != "") {
                input.classList.add('has-val');
            } else {
                input.classList.remove('has-val');
            }
        })
    });

    /* [ Validate ] */
    var input = document.querySelectorAll('.validate-input .input100');

    var validateForm = document.querySelectorAll('.validate-form');
    validateForm.forEach(function (form) {
        form.addEventListener('submit', function () {
            var check = true;
            for (var i = 0; i < input.length; i++) {
                if (validate(input[i]) == false) {
                    showValidate(input[i]);
                    check = false;
                }
            }
            return check;
        })
    });

    input.forEach(function (input) {
        input.addEventListener('focus', function () {
            hideValidate(input);
        });
    });

    function validate(input) {
        if (input.value.trim() == '') {
            return false;
        }
        return true;
    }

    function showValidate(input) {
        var thisAlert = input.parentNode;
        thisAlert.classList.add('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = input.parentNode;
        thisAlert.classList.remove('alert-validate');
    }
});