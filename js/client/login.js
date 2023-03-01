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
        const logout = args[0];
        const apiKey = getCookie(APIKEY_COOKIE_NAME);
        if (logout) {
            if (!apiKey) {
                console.error("No user is currently connected")
            }
            this.requestLogout(apiKey);
        }
        else {
            this.autoLogin(apiKey);
        }
        super.enter(...args);
        validatePage();
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

    onNav(ev) {
        switch (ev.target.id) {
            case "forgot-password":
                return "login";  // TODO FIX
            case "register":
            case "register-fb":
            case "register-tw":
            case "register-gg":
                return "register";
        }
    }

    /*
    * Checks if last user wanted to auto login. If they wanted, then it auto
    * logins.
    */
    autoLogin(apiKey) {
        if (apiKey) {
            console.log("Auto logged in");
            this.getin(apiKey);
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

        if (Object.values(credentials).some((value) => value.trim() === ""))
            return;

        const attemptsCookie = credentials.username + ATTEMPTS_COOKIE_POSTFIX;
        const attempts = parseInt(getCookie(attemptsCookie) ?? 0);

        if (attempts >= ATTEMPTS_MAX) {
            console.error("Too many attempts, try again in 10 minutes")
            return;
        }

        const request = new FXMLHttpRequest();

        request.onload = () => {
            this.handleLoginResponse(request);
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
            console.error("Invalid username or password");
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
        setAutoLogin(apiKey);
        this.getin(apiKey);
    }

    requestLogout(apiKey) {
        const request = new FXMLHttpRequest();
        request.onload = () => {
            this.handleLogoutResponse(request);
        };

        request.open('post', '/logout');
        request.send(apiKey);
    }

    handleLogoutResponse(request) {
        if (request.status === 200) {
            console.log("Logout successful!");
            this.logout();
        }
        else {
            console.error(`Logout failed - responseText = ${request.responseText}`)
        }
    }

    /*
    * Checks if the url has a parameter to logout. If it does, the function
    * logouts and removes the auto login cookie.
    * Returns `true` if logged out. Otherwise, returns `false`.
    */
    logout() {
        //sessionStorage.removeItem('currentUsername');
        removeCookie(APIKEY_COOKIE_NAME);
        //this.navigate(null);  // Move to main page
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


class RegisterPage extends Page {
    constructor() {
        super('register');
    }

    enter(...args) {
        super.enter(...args);
        validatePage();

        const registerForm = document.getElementById('register-form');
        registerForm.addEventListener("submit", (ev) => {
            ev.preventDefault();  // prevent the form from submitting
            this.requsetRegister();
        });

        this.registerFormElements = {
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            passwordVal: document.getElementById('password-val'),
            submit: document.getElementById('submit-button')
        }
    }

    onNav(ev) {
        return "login";
    }

    requsetRegister() {
        const credentials = {
            username: this.registerFormElements.username.value,
            password: this.registerFormElements.password.value,
            passwordVal: this.registerFormElements.passwordVal.value,
        };

        if (Object.values(credentials).some((value) => value.trim() === "") || credentials.password != credentials.passwordVal)
            return;


        const request = new FXMLHttpRequest();

        request.onload = () => {
            this.handleRegisterResponse(request);
        };

        const requestData = JSON.stringify((({ username, password }) => ({ username, password }))(credentials));

        request.open('post', '/register');
        request.send(requestData);
    }

    handleRegisterResponse(request) {
        if (request.status === 200) {
            console.log("Registered successful!");
            this.login(request.responseText);

        } else {
            console.log(`Registration failed - ${request.responseText}`);
        }
    }

    login(/*username, */apiKey) {
        if (document.getElementById("chkAutoLogin").checked)
            setAutoLogin(apiKey);
        this.getin(apiKey);
    }

    getin(/*username,*/ apiKey) {
        // sessionStorage.currentUsername = username;
        this.navigate('empty', apiKey);  // Move to main page
    }

}


// ################################ VALIDATION ################################

function validatePage() {
    var input = document.querySelectorAll('.validate-input .input100');

    input.forEach(function (input) {
        input.addEventListener('focus', function () {
            hideValidate(input);
        });
    });

    var forms = document.querySelectorAll('.validate-form');
    forms.forEach(function (form) {
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

    function validate(input) {
        if (input.value.trim() == '') {
            return false;
        }
        if (input.id === "password-val") {
            return (document.getElementById("password").value === input.value)
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
}