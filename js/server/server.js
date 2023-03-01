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
                case '/register':
                    this.#handleRegisterRequest(request);
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
        const filteredUser = allUsers.filter((user) => (user.obj.username === credentials.username && user.obj.password === credentials.password));
        if (!filteredUser.length) {
            request.setStatus(401);
            return;
        }
        
        const apiKey = generateUUID();
        this.db.add({username: credentials.username}, CONNECTED_CLIENTS_TABLE_NAME, apiKey);
        // this.db.add(credentials, USERS_TABLE_NAME);
        request.setStatus(200);
        request.responseText = apiKey;
    }

    #handleLogoutRequest(request) {
        if (request.method != 'POST') {
            request.setStatus(501);
            return;
        }
        const apiKey = request.body;
        if (!apiKey) {
            request.setStatus(401);
            return;
        }
        
        const allConnectedClients = this.db.getTableItems(CONNECTED_CLIENTS_TABLE_NAME);
        const filteredClient = allConnectedClients.filter((c) => (c.uuid === apiKey));
        if (!filteredClient.length) {
            request.setStatus(401);
            request.responseText = "Client's API Key is not registered!"
            return;
        }
        
        this.db.remove(apiKey);
        request.setStatus(200);
        request.responseText = apiKey;
    }

    #handleRegisterRequest(request) {
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
        const filteredUser = allUsers.filter((user) => (user.obj.username === credentials.username));
        if (filteredUser.length) {
            request.setStatus(401);
            request.responseText = "Username is taken";
            return;
        }
        
        const apiKey = generateUUID();
        this.db.add({username: credentials.username}, CONNECTED_CLIENTS_TABLE_NAME, apiKey);
        this.db.add(credentials, USERS_TABLE_NAME);
        request.setStatus(200);
        request.responseText = apiKey;
    }
}