Network.setServer(new Server());

document.addEventListener('DOMContentLoaded', () => {
    App.init('login', {login: new LoginPage()/*, register: new RegisterPage()*/});
});
