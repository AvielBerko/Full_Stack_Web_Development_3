Network.setServer(new Server());

document.addEventListener('DOMContentLoaded', () => {
    App.init('login', {register: new RegisterPage(), login: new LoginPage(), projects: new ProjectsPage()});
});