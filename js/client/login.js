/*
This module handles the client's login/registration to the page.
It handles the users data in local storage and sets cookies
to block attackers.
*/

/* Name of the auto login cookie. */
// const LOGIN_COOKIE_NAME = "username";
/* Name of the apiKey cookie. */
const APIKEY_COOKIE_NAME = 'apiKey';
/* Number of days until expiration of the auto login cookie. */
const LOGIN_COOKIE_DAYS = 20;
/* Postfix of cookies that track the number of attempted logins. */
const ATTEMPTS_COOKIE_POSTFIX = "_attempts";
/* Number of attempts to login allowed before getting blocked. */
const ATTEMPTS_MAX = 5;
/* Number of minutes the attempts cookie stays alive. */
const ATTEMPTS_MINUTES = 10;

/**
 * This page is a SPA system's page that handles a user login.
 */
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
                //alert("No user is currently connected");
            }
            this.requestLogout(apiKey);
        }
        else {
            if (this.autoLogin(apiKey))
                return;
        }
        super.enter(...args);
        
        // Form validation
        validatePage();

        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener("submit", (ev) => {
            ev.preventDefault();  // prevent the form from submitting
            this.requsetLogin();
        });

        this.loginFormElements = {
            username: document.getElementById('username'),
            password: document.getElementById('password'),
        }
    }

    onNav(ev) {
        switch (ev.target.id) {
            case "forgot-password":
                //return "notImplemented";
                return "login"
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
            return this.getin(apiKey);
        }
    }

    /*
    * Moves to home page after successfuly logged in or registered.
    */
    getin(/*username,*/ apiKey) {
        // sessionStorage.currentUsername = username;
        this.navigate(null, apiKey);  // Move to main page
        return true;
    }

    /**
     * Sends a login FAJAX request to the server if the form was filled correctly and
     * the user is not blocked by 'Too many attampts'.
     */
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
            //console.error("Too many wrong attempts, try again in 10 minutes")
            alert("Too many wrong attempts, try again in 10 minutes");
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

    /**
     * Handles the FAJAX respnse from the server.
     * Logges the user in if the credentials were correct, increases the number of
     * wrong attempts if they weren't.
     * @param request - The FAJAX object with the response details.
     */
    handleLoginResponse(request) {
        if (request.status === 200) {
            console.log("Login successful!");
            this.login(request.responseText);
        } else {
            // console.error("Invalid username or password");
            alert("Invalid username or password");
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

    /**
     * Logs the user in and sets AutoLogin if the user chose to do so.
     * @param apiKey - The uniqe apiKey received by the server to the loggen in user.
     */
    login(/*username, */apiKey) {
        if (document.getElementById("chkAutoLogin").checked) {
            setAutoLogin(apiKey);
        }
        this.getin(apiKey);
    }

    /**
     * Sends a logout FAJAX request to the server.
     * @param apiKey - The user's apiKey.
     */
    requestLogout(apiKey) {
        const request = new FXMLHttpRequest();
        request.onload = () => {
            this.handleLogoutResponse(request);
        };

        request.open('delete', '/logout');
        request.send(apiKey);
    }

    /**
     * Handles the FAJAX respnse from the server.
     * Logges the user out if server logged the user out successfuly.
     * @param request - The FAJAX object with the response details.
     */
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
    * Removes the apiKey cookie (keeps the user at login page).
    */
    logout() {
        //sessionStorage.removeItem('currentUsername');
        removeCookie(APIKEY_COOKIE_NAME);
        //this.navigate(null);  // Move to main page
    }
}

/**
 * This page is a SPA system's page that handles a user register.
 */
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
            passwordVal: document.getElementById('password-val')
        }
    }

    onNav(ev) {
        return "login";
    }

    /**
     * Sends a registration FAJAX request to the server if the form was filled correctly and
     * the user is not blocked by 'Too many attampts'.
     */
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

    /**
    * Handles the FAJAX respnse from the server.
    * Logges the user in if the registration was completed successfuly/
    * @param request - The FAJAX object with the response details.
    */
    handleRegisterResponse(request) {
        if (request.status === 200) {
            console.log("Registered successful!");
            this.login(request.responseText);

        } else {
            //console.error(`Registration failed - ${request.responseText}`);
            showValidate(this.registerFormElements.username, 'Username already Taken');
            //alert(`Registration failed - ${request.responseText}`);
        }
    }

    /**
    * Logs the user in and sets AutoLogin if the user chose to do so.
    * @param apiKey - The uniqe apiKey received by the server to the loggen in user.
    */
    login(/*username, */apiKey) {
        if (document.getElementById("chkAutoLogin").checked)
            setAutoLogin(apiKey);
        this.getin(apiKey);
    }

    /*
    * Moves to home page after successfuly logged in or registered.
    */
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
}

function validate(input) {
    if (input.value.trim() == '') {
        return false;
    }
    if (input.id === "password-val") {
        return (document.getElementById("password").value === input.value)
    }
    return true;
}

function showValidate(input, message) {
    var thisAlert = input.parentNode;
    if (message)
        thisAlert.setAttribute('data-validate', message);
    thisAlert.classList.add('alert-validate');
}

function hideValidate(input) {
    var thisAlert = input.parentNode;
    thisAlert.classList.remove('alert-validate');
}