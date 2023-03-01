Network.setServer(new Server());

document.addEventListener('DOMContentLoaded', () => {
    App.init('empty', {register: new RegisterPage(), login: new LoginPage(), empty: new EmptyPage()});
});

class EmptyPage extends Page {
    constructor() {
        super("empty");
    }

    onNav(ev) {
        switch (ev.target.id) {
            case "register":
                return "register";
            case "login":
                return ["login", false];
            case "logout":
                return ["login", true]
        }
    }
}