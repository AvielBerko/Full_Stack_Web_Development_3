const DB_NAME = 'database'
const USERS_TABLE_NAME = 'users';
const PROJECTS_TABLE_NAME = 'projects';
const TASKS_TABLE_NAME = 'tasks';
const SYNCS_TABLE_NAME = 'syncs';
const CONNECTED_CLIENTS_TABLE_NAME = 'connectedClients';

class Server {

    constructor() {
        this.db = new Database(new LocalStorageDB(), DB_NAME);
        this.#initDB([USERS_TABLE_NAME, PROJECTS_TABLE_NAME, TASKS_TABLE_NAME, SYNCS_TABLE_NAME, CONNECTED_CLIENTS_TABLE_NAME]);
    }
    
    #initDB(tables) {
        for (let table of tables) {
            try {
                this.db.addTable(table);
            }
            catch {}
        }
    }

    handle(request) {
        try {
            switch (request.url)  {
                case '/login':
                    this.#handleLoginRequest(request);
                    break;
                case '/logout':
                    this.#handleLogoutRequest(request);
                    break;
                case '/regiser':
                    this.#register(request);
                    break;
            }
        }
        catch (ex) {
            console.error(ex);
            request.setStatus(500);
        }
        
    }

    #handleLoginRequest(request) {
        let credentials;
        if (request.method != 'POST') {
            request.setStatus(501);
            return;
        }
        try {
            credentials = JSON.parse(request.body)
        }
        catch {
            request.setStatus(401);
            return;
        }

        
        const allUsers = this.db.getTableItems(USERS_TABLE_NAME);
        const filteredUser = allUsers.filter((user) => (user.username === credentials.username && user.password === credentials.password));
        if (!filteredUser.length) {
            request.setStatus(401);
            return;
        }
        
        const apiKey = generateUUID();
        this.db.add({apiKey: apiKey, username: credentials.username}, CONNECTED_CLIENTS_TABLE_NAME);
        // this.db.add(credentials, USERS_TABLE_NAME);
        request.setStatus(200);
        request.responseText = apiKey;
    }

    #handleLogoutRequest(request) {
    }

    #register(request) {

    }
}