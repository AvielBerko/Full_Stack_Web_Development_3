Network.setServer(new Server());

document.addEventListener('DOMContentLoaded', () => {
    App.init('register', {register: new RegisterPage(), login: new LoginPage(), empty: new Page("empty")});
});
