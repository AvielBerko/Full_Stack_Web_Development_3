class Server {
    constructor() {
        this.count = 0;
        this.projects = {
            ["76ab2311-e950-4777-a4c0-a1739b205e17"]: {
                title: "next",
                description: "My next actions",
            },
            ["2595371b-63be-467a-9dcc-75893c3e9479"]: {
                title: "FS",
                description: "My fullstack course tasks",
            },
            sync: "834c3466-2340-4e0d-bffa-959661173aaf",
        };
    }

    handle(request) {
        this.count += 1;
        console.log(this.count, request.method, request.url);
        if (!request.getRequestHeader("Authorization")) {
            request.setStatus(401);
            return;
        }

        if (request.url === '/projects' && request.method === "GET") {
            request.setStatus(200);
            request.responseText = JSON.stringify(
                this.#createProjectsList());
        } else if (request.url === '/projects/sync' &&
                   request.method === "GET") {
            request.setStatus(200);
            request.responseText = this.projects.sync
        } else if (request.url.startsWith('/projects/update/') &&
                   request.method === "PUT") {
            const {id, title, description} = JSON.parse(request.body);
            if (!title) {
                request.setStatus(400);
            } else if (!this.projects[id]) {
                request.setStatus(404);
            } else {
                this.projects[id].title = title;
                this.projects[id].description = description;
                const newSync = "22bdf7cc-6bb7-4438-8be4-c61e0a6bcdf" + this.count;
                request.setStatus(200);
                request.responseText = JSON.stringify({
                    oldSync: this.projects.sync,
                    newSync: newSync,
                });
                this.projects.sync = newSync;
            }
        } else {
            request.setStatus(501);
        }


        if (this.count === 2) {
            this.projects["71304cef-6b99-4aed-9305-f530b57fb5fd"] = {
                title: "PA",
                description: "My parallel algorithms course tasks",
            };
            delete this.projects["76ab2311-e950-4777-a4c0-a1739b205e17"];
            this.projects.sync = "12bdf7cc-6bb7-4438-8be4-c61e0a6bcdf6";
        }
    }

    #createProjectsList() {
        const result = {
            projects: [],
            sync: this.projects.sync
        };
        for (const id in this.projects) {
            if (id !== "sync") {
                result.projects.push({
                    id: id,
                    ...this.projects[id]
                });
            }
        }
        return result;
    }
}
