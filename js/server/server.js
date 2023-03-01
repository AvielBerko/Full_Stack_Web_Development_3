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
    
    /**
     * Initializes the server's database with the given tables (adds the tables that does not
     * already exist)
     * @param tables - The needed tables in server's database.
     */
    #initDB(tables) {
        for (let table of tables) {
            try {
                this.db.addTable(table);
            }
            catch {}
        }
    }

    /**
     * 
     * @param request 
     */
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

    /**
     * Hendles a client's login request.
     * If the login completed successfuly, generate an apiKey for the user and add him to the
     * list of connectedClients.
     * @param request - The FAJAX request the client has sent.
     */
    #handleLoginRequest(request) {
        let credentials;
        // Checks that the requset is done by POST HTTP method
        if (request.method != 'POST') {
            request.setStatus(501);
            return;
        }
        // Tries to parse the client's request body (his username & password)
        try {
            credentials = JSON.parse(request.body)
        }
        catch {
            request.setStatus(401);
            return;
        }

        // Gets all users and filters the user with the given username and password
        const allUsers = this.db.getTableItems(USERS_TABLE_NAME);
        const filteredUser = allUsers.filter((user) => (user.obj.username === credentials.username && user.obj.password === credentials.password));
        // If no such user was found
        if (!filteredUser.length) {
            request.setStatus(401);
            return;
        }
        
        // The login was successful 
        const apiKey = this.#connectClient(username);
        request.setStatus(200);
        request.responseText = apiKey;
    }

    /**
    * Hendles a client's logout request.
    * If the logout completed successfuly, removes the client's apiKey from connectedClients.
    * @param request - The FAJAX request the client has sent.
    */
    #handleLogoutRequest(request) {
         // Checks that the requset is done by POST HTTP method
        if (request.method != 'POST') {
            request.setStatus(501);
            return;
        }
        const apiKey = request.body;
        if (!apiKey) {
            request.setStatus(401);
            return;
        }
        
        // Gets all connectedClients and filters the apiKey given from the client
        const allConnectedClients = this.db.getTableItems(CONNECTED_CLIENTS_TABLE_NAME);
        const filteredClient = allConnectedClients.filter((c) => (c.uuid === apiKey));

        // If no such apiKey was found
        if (!filteredClient.length) {
            request.setStatus(401);
            request.responseText = "Client's API Key is not registered!"
            return;
        }

         // The logout was successful 
        this.db.remove(apiKey);
        request.setStatus(200);
    }

    /**
    * Hendles a client's registration request.
    * If the registration completed successfuly, generate an apiKey for the user and add him to the
    * list of connectedClients.
    * @param request - The FAJAX request the client has sent.
    */
    #handleRegisterRequest(request) {
        let credentials;
        // Checks that the requset is done by POST HTTP method
        if (request.method != 'POST') {
            request.setStatus(501);
            return;
        }
        // Tries to parse the client's request body (his username & password)
        try {
            credentials = JSON.parse(request.body)
        }
        catch {
            request.setStatus(401);
            return;
        }

        // Gets all users and filters the user with the given username
        const allUsers = this.db.getTableItems(USERS_TABLE_NAME);
        const filteredUser = allUsers.filter((user) => (user.obj.username === credentials.username));

        // If such user exist - don't allow the registration
        if (filteredUser.length) {
            request.setStatus(401);
            request.responseText = "Username is taken";
            return;
        }
        
        // The registration was successful.
        const apiKey = this.#connectClient(username);
        this.db.add(credentials, USERS_TABLE_NAME);
        request.setStatus(200);
        request.responseText = apiKey;
    }

    #connectClient(username) {
        const apiKey = generateUUID();
        this.db.add({username: username}, CONNECTED_CLIENTS_TABLE_NAME, apiKey);
        return apiKey;
    }
}