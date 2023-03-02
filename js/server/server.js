"use strict";

const DB_NAME = 'database'
const USERS_TABLE_NAME = 'users';
const PROJECTS_TABLE_NAME = 'projects';
const TASKS_TABLE_NAME = 'tasks';
const CONNECTED_CLIENTS_TABLE_NAME = 'connectedClients';

class Server {

    constructor() {
        this.db = new Database(new LocalStorageDB(), DB_NAME);
        this.#initDB([
            USERS_TABLE_NAME,
            PROJECTS_TABLE_NAME,
            TASKS_TABLE_NAME,
            CONNECTED_CLIENTS_TABLE_NAME,
        ]);
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
            catch { }
        }
    }

    /**
     * 
     * @param request 
     */
    handle(request) {
        request.url = request.url.toLowerCase();
        // Trim ending slashes from the url.
        request.url = request.url.replace(/\/+$/, '');

        try {
            const requestType = this.#getRequestType(request.url);
            switch (requestType) {
                case '/login':
                    this.#handleLoginRequest(request);
                    break;
                case '/autologin':
                    this.#handleAutoLoginRequest(request);
                    break;
                case '/logout':
                    this.#handleLogoutRequest(request);
                    break;
                case '/register':
                    this.#handleRegisterRequest(request);
                    break;
                case '/projects':
                    this.#handleProjectsRequest(request);
                    break;
                case '/tasks':
                    this.#handleTasksRequest(request);
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
        const filteredUser = allUsers.filter((user) =>
        (user.obj.username === credentials.username &&
            user.obj.password === credentials.password));
        // If no such user was found
        if (!filteredUser.length) {
            request.setStatus(401);
            return;
        }

        // The login was successful 
        const apiKey = this.#connectClient(filteredUser[0].uuid);
        request.setStatus(200);
        request.responseText = apiKey;
    }

    /**
    * Hendles a client's autologin request.
    * @param request - The FAJAX request the client has sent.
    */
    #handleAutoLoginRequest(request) {
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

        // If no such user was found
        if (!this.#checkClientConnected(apiKey)) {
            request.setStatus(401);
            request.responseText = "API Key is invalid";
            return;
        }

        // The auto-login was successful 
        request.setStatus(200);
    }

    /**
    * Hendles a client's logout request.
    * If the logout completed successfuly, removes the client's apiKey from connectedClients.
    * @param request - The FAJAX request the client has sent.
    */
    #handleLogoutRequest(request) {
        // Checks that the requset is done by POST HTTP method
        if (request.method != 'DELETE') {
            request.setStatus(501);
            return;
        }
        const apiKey = request.body;
        if (!apiKey) {
            request.setStatus(401);
            return;
        }

        // If no such apiKey was found
        if (!this.#checkClientConnected(apiKey)) {
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
        let newUser;
        // Checks that the requset is done by POST HTTP method
        if (request.method != 'POST') {
            request.setStatus(501);
            return;
        }
        // Tries to parse the client's request body (his username & password)
        try {
            newUser = JSON.parse(request.body)
        }
        catch {
            request.setStatus(401);
            return;
        }

        // Gets all users and filters the user with the given username
        const allUsers = this.db.getTableItems(USERS_TABLE_NAME);
        const filteredUser = allUsers.filter(
            (user) => (user.obj.username === newUser.username));

        // If such user exist - don't allow the registration
        if (filteredUser.length) {
            request.setStatus(401);
            request.responseText = "Username is taken";
            return;
        }

        // The registration was successful.
        newUser.projectsSync = generateUUID();
        const userId = this.db.add(newUser, USERS_TABLE_NAME);
        const apiKey = this.#connectClient(userId);
        request.setStatus(200);
        request.responseText = apiKey;
    }

    #connectClient(userId) {
        const apiKey = generateUUID();
        this.db.add({ userId: userId }, CONNECTED_CLIENTS_TABLE_NAME, apiKey);
        return apiKey;
    }

    #checkClientConnected(apiKey) {
        // Gets all connectedClients and filters the apiKey given from the client
        const allConnectedClients = this.db.getTableItems(CONNECTED_CLIENTS_TABLE_NAME);
        const filteredClient = allConnectedClients.filter((c) => (c.uuid === apiKey));
        return filteredClient.length
    }
    #handleProjectsRequest(request) {
        // Any projects request must be authorized first.
        const userId = this.#authorizeUser(request);
        if (!userId) {
            return;
        }
        const user = this.db.get(userId);

        if (request.method === "GET" && request.url === "/projects") {
            // Creates the user's projects list and gets the user's
            // projects sync to send in the response.
            const projects = this.db.getTableItems(PROJECTS_TABLE_NAME).filter(
                proj => proj.obj.creator === userId
            ).map(({ uuid, obj }) => ({
                id: uuid,
                title: obj.title,
                description: obj.description,
            }));
            const sync = user.projectsSync;

            request.setStatus(200);
            request.responseText = JSON.stringify({
                projects: projects,
                sync: sync
            });
        } else if (request.method === "GET" &&
            request.url === "/projects/sync") {
            // Sends the latest projects sync value.
            request.setStatus(200);
            request.responseText = user.projectsSync;
        } else if (request.method === "POST" &&
            request.url === "/projects/new") {
            // Validate that the request has at least a title.
            const project = {};
            try {
                const { title, ...rest } = JSON.parse(request.body)
                if (!title) {
                    request.setStatus(400);
                    return;
                }
                project.title = title.toString();
                project.description = rest.description?.toString() ?? "";
                project.creator = userId;
                project.tasksSync = generateUUID();
            } catch {
                request.setStatus(400);
                return;
            }

            // Creates the new project and the new sync.
            const projectId = this.db.add(project, PROJECTS_TABLE_NAME);
            const oldSync = user.projectsSync;
            const newSync = generateUUID();
            user.projectsSync = newSync;
            this.db.update(userId, user);

            request.setStatus(201);
            request.responseText = JSON.stringify({
                projectId: projectId,
                oldSync: oldSync,
                newSync: newSync,
            });
        } else if (request.method === "PUT" &&
            request.url === "/projects/update") {
            // Validate that the request has a project id, and at least a
            // title to update.
            let projectId;
            const updatedProject = {};
            try {
                const { id, title, ...rest } = JSON.parse(request.body)
                if (!id || !title) {
                    request.setStatus(400);
                    return;
                }
                projectId = id.toString();
                updatedProject.title = title.toString();
                updatedProject.description =
                    rest.description?.toString() ?? "";
            } catch {
                request.setStatus(400);
                return;
            }

            // Checks that the project exists, and copies data from the old
            // project.
            try {
                const oldProject = this.db.get(projectId);
                updatedProject.creator = oldProject.creator;
                updatedProject.tasksSync = oldProject.tasksSync;
            } catch {
                request.setStatus(404);
                return;
            }

            // Updates the project and creates a new sync.
            this.db.update(projectId, updatedProject);
            const oldSync = user.projectsSync;
            const newSync = generateUUID();
            user.projectsSync = newSync;
            this.db.update(userId, user);

            request.setStatus(200);
            request.responseText = JSON.stringify({
                oldSync: oldSync,
                newSync: newSync,
            });
        } else if (request.method === "DELETE") {
            // Deletes the given project from the database. The given project
            // id can be found in the url.
            const projectId = request.url.substring('/projects/'.length);

            // Deletes the project if the project exists and authorized.
            try {
                const project = this.db.get(projectId);
                if (project.creator !== userId) {
                    request.setStatus(403);
                    return;
                }

                // Remove the project's tasks.
                this.db.getTableItems(TASKS_TABLE_NAME).filter(
                    task => task.obj.parent === projectId
                ).forEach(
                    task => this.db.remove(task.uuid)
                );

                this.db.remove(projectId);
            } catch {
                // Ignore missing project when trying to delete because who
                // cares that the project doesn't exist?
            }

            // Update the projects sync.
            const oldSync = user.projectsSync;
            const newSync = generateUUID();
            user.projectsSync = newSync;
            this.db.update(userId, user);

            request.setStatus(200);
            request.responseText = JSON.stringify({
                oldSync: oldSync,
                newSync: newSync,
            });
        } else {
            request.setStatus(400);
        }
    }

    #handleTasksRequest(request) {
        // Any tasks request must be authorized first.
        const userId = this.#authorizeUser(request);
        if (!userId) {
            return;
        }
        const user = this.db.get(userId);

        if (request.method === "GET" &&
            request.url.startsWith("/tasks?parent=")) {
            // This request asks get a given project's tasks. The tasks' parent
            // is given in the url's parameters.

            const projectId = request.url.substring(
                "/tasks?parent=".length);
            let sync;

            // Checks that the project exists and authorizes the user.
            try {
                const project = this.db.get(projectId);
                if (project.creator !== userId) {
                    request.setStatus(403);
                    return;
                }
                sync = project.tasksSync;
            } catch {
                request.setStatus(404);
                return;
            }

            // Creates the tasks list to send in the response.
            const tasks = this.db.getTableItems(TASKS_TABLE_NAME).filter(
                task => task.obj.parent === projectId && !task.obj.complete
            ).map(({ uuid, obj }) => ({
                id: uuid,
                title: obj.title,
                description: obj.description,
                parent: obj.parent,
            }));

            request.setStatus(200);
            request.responseText = JSON.stringify({
                tasks: tasks,
                sync: sync,
            });
        } else if (request.method === "GET" &&
            request.url.startsWith("/tasks/sync?parent=")) {
            // This request asks get the sync value of a given project's tasks.
            // The tasks' parent is given in the url's parameters.

            let sync;
            const projectId = request.url.substring(
                "/tasks/sync?parent=".length);

            // Checks that the project exists and authorizes the user.
            try {
                const project = this.db.get(projectId);
                if (project.creator !== userId) {
                    request.setStatus(403);
                    return;
                }
                sync = project.tasksSync;
            } catch {
                request.setStatus(404);
                return;
            }

            request.setStatus(200);
            request.responseText = sync;
        } else if (request.method === "POST" &&
            request.url === "/tasks/new") {
            // This request asks to creates a new task in a given project.

            // Validate that the request has a project id and at least a title.
            const task = {
                creator: userId,
                complete: false,
            };
            let project;
            try {
                const { parent, title, ...rest } = JSON.parse(request.body)
                if (!parent || !title) {
                    request.setStatus(400);
                    return;
                }
                task.parent = parent;
                task.title = title.toString();
                task.description = rest.description?.toString() ?? "";
            } catch {
                request.setStatus(400);
                return;
            }

            // Check that the given project exists.
            try {
                project = this.db.get(task.parent);
            } catch {
                request.setStatus(404);
                return;
            }

            // Creates the new task and the new sync.
            const taskId = this.db.add(task, TASKS_TABLE_NAME);
            const oldSync = project.tasksSync;
            const newSync = generateUUID();
            project.tasksSync = newSync;
            this.db.update(task.parent, project);

            request.setStatus(201);
            request.responseText = JSON.stringify({
                taskId: taskId,
                oldSync: oldSync,
                newSync: newSync,
            });
        } else if (request.method === "PUT" &&
            request.url.startsWith("/tasks/complete/")) {
            // This request asks to complete a given task. The given task id
            // can be found in the url.

            const taskId = request.url.substring('/tasks/complete/'.length);
            let projectId;

            // Completes the task if the task exists and authorized.
            try {
                const task = this.db.get(taskId);
                if (task.creator !== userId) {
                    request.setStatus(403);
                    return;
                }
                task.complete = true;
                this.db.update(taskId, task);
                projectId = task.parent;
            } catch {
                request.setStatus(404);
                return;
            }

            // Update the task's project sync.
            const project = this.db.get(projectId);
            const oldSync = project.tasksSync;
            const newSync = generateUUID();
            project.tasksSync = newSync;
            this.db.update(projectId, project);

            request.setStatus(200);
            request.responseText = JSON.stringify({
                oldSync: oldSync,
                newSync: newSync,
            });
        } else if (request.method === "PUT" &&
            request.url === "/tasks/update") {
            // This request asks to update a given task's data.

            // Validate that the request has a task id, and at least a
            // title to update.
            let taskId;
            const updatedTask = {};
            try {
                const { id, title, ...rest } = JSON.parse(request.body)
                if (!id || !title) {
                    request.setStatus(400);
                    return;
                }
                taskId = id.toString();
                updatedTask.title = title.toString();
                updatedTask.description = rest.description?.toString() ?? "";
            } catch {
                request.setStatus(400);
                return;
            }

            // Checks that the task exists, and copies data from the old task.
            try {
                const oldTask = this.db.get(taskId);
                updatedTask.creator = oldTask.creator;
                updatedTask.complete = oldTask.complete;
                updatedTask.parent = oldTask.parent;
            } catch {
                request.setStatus(404);
                return;
            }

            // Updates the project and creates a new sync.
            this.db.update(taskId, updatedTask);
            const project = this.db.get(updatedTask.parent);
            const oldSync = project.tasksSync;
            const newSync = generateUUID();
            project.tasksSync = newSync;
            this.db.update(updatedTask.parent, project);

            request.setStatus(200);
            request.responseText = JSON.stringify({
                oldSync: oldSync,
                newSync: newSync,
            });
        } else if (request.method === "DELETE") {
            // This request asks to delete a given task. The given task id can
            // be found in the url.

            const taskId = request.url.substring('/tasks/'.length);
            let projectId;

            // Deletes the task if the task exists and authorized.
            try {
                const task = this.db.get(taskId);
                if (task.creator !== userId) {
                    request.setStatus(403);
                    return;
                }
                this.db.remove(taskId);
                projectId = task.parent;
            } catch {
                // Ignore missing task when trying to delete because who cares
                // that the task doesn't exist?
            }

            // Update the task's project sync.
            const project = this.db.get(projectId);
            const oldSync = project.tasksSync;
            const newSync = generateUUID();
            project.tasksSync = newSync;
            this.db.update(projectId, project);

            request.setStatus(200);
            request.responseText = JSON.stringify({
                oldSync: oldSync,
                newSync: newSync,
            });
        } else {
            request.setStatus(400);
        }
    }

    /**
     * Gets the requst type from the given url. A request type is the first
     * word between the first slash and the second slash (if exists).
     *
     * @param url The url string to get the request type from.
     * @return String of the request type
     */
    #getRequestType(url) {
        let endRequest = url.indexOf('/', 1);
        if (endRequest < 0) endRequest = url.indexOf('?');
        return url.substring(0, endRequest >= 0 ? endRequest : url.length);
    }

    /**
     * Validates the authorization header of the request. If the user is
     * authorized, then returns the user id. This function sets the correct
     * status in the request.
     *
     * @param request The FXMLHttpRequest to authorize.
     * @return The authorized userId.
     */
    #authorizeUser(request) {
        const auth = request.getRequestHeader("Authorization");
        if (!auth) {
            request.setStatus(401);
            return null;
        }
        const [prefix, apiKey] = auth.split(" ");
        if (!prefix || !apiKey || prefix.toLowerCase() !== "apikey") {
            request.setStatus(400);
            return null;
        }
        try {
            return this.db.get(apiKey).userId;
        } catch {
            request.setStatus(401);
            return null;
        }
    }
}
