"use strict";

class Usernames {
    static init() {
        if (document.cookie) {
            this.user = document.cookie;
        }
    }

    static login(username, password) {
        if (!localStorage.usernames) {
            return false;
        }
        const usernames = JSON.parse(localStorage.usernames);
        if (usernames[username]?.password === password) {
            this.user = username;
            document.cookie = username;
            return true;
        }
        return false;
    }

    static register(username, email, password) {
        if (!username || !email || !password) {
            return false;
        }
        const usernames = localStorage.usernames
            ? JSON.parse(localStorage.usernames)
            : {};
        if (usernames[username]) {
            return false;
        }
        usernames[username] = {
            username: username,
            email: email,
            password: password,
            heads: {wins:0,loses:0},
            tails: {wins:0,loses:0},
        };
        localStorage.usernames = JSON.stringify(usernames);
        return true;
    }

    static gameOver(won, pick) {
        const usernames = JSON.parse(localStorage.usernames);
        if (won) {
            usernames[this.user][pick].wins += 1;
        } else {
            usernames[this.user][pick].loses += 1;
        }
        localStorage.usernames = JSON.stringify(usernames);
    }

    static getStats() {
        const usernames = JSON.parse(localStorage.usernames);
        const stats = {
            heads: {
                wins:usernames[this.user].heads.wins,
                loses:usernames[this.user].heads.loses,
            },
            tails: {
                wins:usernames[this.user].tails.wins,
                loses:usernames[this.user].tails.loses,
            },
        };
        stats.overall = {
            wins:stats.heads.wins + stats.tails.wins,
            loses:stats.heads.loses + stats.tails.loses,
        };
        return stats;
    }

    static logout() {
        document.cookie = `${Usernames.user}; ` +
            `expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        Usernames.user = undefined;
    }
}

Usernames.init();

class LoginPage extends Page {
    constructor() {
        super("login");
    }

    enter(...args) {
        Usernames.logout();
        super.enter(...args);

        document.getElementById("info").textContent = "";
        document.getElementById("error").textContent = "";
        if (args[0] === "info" || args[0] === "error") {
            document.getElementById(args[0]).textContent = args[1] ?? "";
        }
    }

    onNav(ev) {
        switch (ev.target.id) {
            case "register":
                return "register";
            case "login":
                const username = document.getElementById("username").value;
                const password = document.getElementById("password").value;
                if (Usernames.login(username, password)) {
                    return "game";
                }
                alert("Wrong username or password!");
                break;
        }
    }
}

class RegisterPage extends Page {
    constructor() {
        super("register");
    }

    enter(...args) {
        Usernames.logout();
        super.enter(...args);
    }

    onNav(ev) {
        switch (ev.target.id) {
            case "login":
                return "login";
            case "register":
                const username = document.getElementById("username").value;
                const email = document.getElementById("email").value;
                const password = document.getElementById("password").value;
                if (!username || !email || !password) {
                    alert("Missing some fields!");
                    return;
                }
                if (!Usernames.register(username, email, password)) {
                    alert("Username already exists!");
                    return;
                }
                return ["login", "info",
                    `Login with ${username} to start playing`];
        }
    }
}

class GamePage extends Page {
    constructor() {
        super("game");
    }

    enter(...args) {
        if (!Usernames.user) {
            this.navigate("login", "error", "You must login before playing");
            return;
        }

        super.enter(...args);

        document.getElementById("username").textContent =
            "Hello, " + Usernames.user;
        this.updateTable();
        document.getElementById("btnHeads").addEventListener("click", 
            () => this.play("heads")
        );
        document.getElementById("btnTails").addEventListener("click", 
            () => this.play("tails")
        );
    }

    play(pick) {
        const picks = ["heads", "tails"];
        const rand = picks[Math.floor(Math.random() * 2)];
        const result = document.getElementById("result");
        result.textContent = `You chose ${pick}, the coin flipped ${rand}, `;
        if (pick === rand) {
            Usernames.gameOver(true, pick);
            result.textContent += "you won!";
        } else {
            Usernames.gameOver(false, pick);
            result.textContent += "you lost!";
        }

        this.updateTable();
    }

    updateTable() {
        const stats = Usernames.getStats();
        document.getElementById("tblHeadsWins").textContent =
            stats.heads.wins;
        document.getElementById("tblHeadsLoses").textContent =
            stats.heads.loses;
        document.getElementById("tblTailsWins").textContent =
            stats.tails.wins;
        document.getElementById("tblTailsLoses").textContent =
            stats.tails.loses;
        document.getElementById("tblOverallWins").textContent =
            stats.overall.wins;
        document.getElementById("tblOverallLoses").textContent =
            stats.overall.loses;
    }

    onNav(ev) {
        if (ev.target.id === "logout") {
            return "login";
        }
    }

    clear() {
        super.clear();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    App.init("game", {
        login: new LoginPage(),
        register: new RegisterPage(),
        game: new GamePage(),
    });
});
