/**
 * This file contains the implementation of the class TodosContext.
 *
 * @file todos_context.js
 */

"use strict";

/**
 * This class manages the logic of receiving and giving the projects and tasks
 * data with the server.
 */
class TodosContext {
    /**
     * Creates a new instance of TodosContext for a specific user.
     *
     * @param apiKey The user's api key.
     */
    constructor(apiKey) {
        this._apiKey = apiKey;
    }

    /**
     * Syncs the projects with the server asynchronously. After finished
     * synching with the server, the given callback will be called with the
     * updated projects.
     *
     * If an api error occures, the callback onerror will be called with the
     * server's response.
     *
     * @param callback Optional. A Function that gets the projects.
     * @param onerror  Optional. A Function that gets the server's error
     *                 response.
     */
    syncProjects(callback, onerror) {
        const _getProjects = () => {
            const projectsReq = this.#createRequest("GET", "/projects");
            projectsReq.onload = () => {
                if (projectsReq.status !== 200) {
                    onerror?.(projectsReq);
                    return;
                }

                // Saves the projects in this._projects and the sync value in
                // this._projectsSync.
                this._projects = {};
                const response = JSON.parse(projectsReq.responseText);
                for (const projId in response) {
                    if (projId === "sync") {
                        this._projectsSync = response[projId];
                    } else {
                        this._projects[projId] = response[projId];
                    }
                }
                callback?.(this._projects);
            }
            projectsReq.send();
        };

        // Checks if already have cached projects.
        if (!this._projectsSync) {
            _getProjects();
            return;
        } 

        // Already have cached projects, therefore, checks if needs to sync.
        const syncReq = this.#createRequest("GET", "/projects/sync");
        syncReq.onload = () => {
            if (syncReq.status !== 200) {
                onerror?.(projectsReq);
                return;
            }

            if (this._projectsSync === syncReq.responseText) {
                // Doesn't need to sync.
                callback?.(this._projects);
                return;
            }

            // Needs to sync.
            _getProjects();
        };
        syncReq.send();
    }

    /**
     * Creates a opened FXMLHttpRequest with default headers (i.e.
     * authorization header).
     *
     * @param method The http request method.
     * @param url The http request url.
     * @return The created FXMLHttpRequest object.
     */
    #createRequest(method, url) {
        const fxhr = new FXMLHttpRequest();
        fxhr.open(method, url);
        fxhr.setRequestHeader("Authorization", "ApiKey " + this.apiKey);
        return fxhr;
    }
}
