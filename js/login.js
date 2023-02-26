/*
This module handles the client's login/signup to the page.
It handles the users data in local storage and sets cookies
to block attackers.
*/
let login_1_signup_0 = JSON.parse(localStorage.getItem('login_1_signup_0'));
refresh(login_1_signup_0);

const COOKIE_TIMEOUT = 5 * 60; // 5 minutes

function addUser(username, password) {
  let storedUsers = JSON.parse(localStorage.getItem('users'));
  if (storedUsers != null) {
    if (storedUsers.some((cred) => cred.username === username)) {
      alert("Username already taken");
      return false;
    }
  }
  else {
    storedUsers = []
  }
  // create a new user object
  const user = {
    username: username,
    password: password
  };
  // add the new user to the list of users
  storedUsers.push(user);
  // save the list of users to local storage
  localStorage.setItem('users', JSON.stringify(storedUsers));
  return true;
}

function checkCredentials(username, password) {
  var tries = parseInt(getCookie(username + '_tries') || 0);
  if (tries >= 5) {
    setCookie(username + '_tries', tries + 1, COOKIE_TIMEOUT);
    alert('Too Many Tries. Try again in 5 minutes.')
    return;
  }
  // retrieve the list of users from local storage
  const storedUsers = JSON.parse(localStorage.getItem('users'));
  if (storedUsers != null) {
    // iterate through the list of users
    for (const user of storedUsers) {
      // check if the username and password match a user in the list
      if (user.username === username) {
        if (user.password === password) {
          setCookie(username + '_tries', 0, 0);  // remove the tries cookie
          return true;  // return true if the credentials are valid
        }
        else {
          setCookie(username + '_tries', tries + 1, COOKIE_TIMEOUT);  // increase tries cookie
        }
      }
    }
  }
  alert('Invalid username or password');
  // return false if the credentials are not valid
  return false;
}

const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (event) => {
  // prevent the form from submitting
  event.preventDefault();

  // get the username and password from the form
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  let valid;
  if (username == '' || password == '') {
    return;
  }
  if (login_1_signup_0) {
    // check if the credentials are valid
    if (checkCredentials(username, password)) {
      valid = true;
    }
  } else {
    if (addUser(username, password)) {
      valid = true;
    }
  }
  if (valid) {
    localStorage.setItem("active_user", JSON.stringify(username));
    if (redirect = JSON.parse(localStorage.getItem('redirect'))) {
      localStorage.removeItem('redirect');
      location.replace(redirect);
    }
    else { 
      location.replace("index.html"); 
    }
  }
});


const signupLink = document.getElementById('signup-link');
signupLink.addEventListener('click', (event) => {
  login_1_signup_0 = !login_1_signup_0;
  refresh(login_1_signup_0);
});

function refresh(login_1_signup_0) {
  // prevent the default action (i.e., following the link)
  const header = document.getElementById('login-signup-h');
  const button = document.getElementById('submit-button');
  const text = document.getElementById('signup-text');
  const signupLink = document.getElementById('signup-link');

  // update the header text to "Sign Up"
  header.innerHTML = login_1_signup_0 ? 'Login' : 'Sign Up';
  button.innerHTML = login_1_signup_0 ? 'Login' : 'Sign Up';
  text.innerHTML = login_1_signup_0 ? 'Or Sign Up Using' : 'Already have an account?'
  signupLink.innerHTML = login_1_signup_0 ? 'Sign Up' : 'Login';
};


// validation
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

var validateForm = document.querySelector('.validate-form');
validateForm.addEventListener('submit', function () {
  var check = true;
  for (var i = 0; i < input.length; i++) {
    if (validate(input[i]) == false) {
      showValidate(input[i]);
      check = false;
    }
  }
  return check;
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