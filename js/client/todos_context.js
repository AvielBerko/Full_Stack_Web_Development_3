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
        /**
         * The authenticated user's api key. Without this key, it's impossible
         * to get or update the user's data.
         */
        this.apiKey = apiKey;
        /**
         * List containing all the synced projects from the server.
         */
        this._projects = null;
        /**
         * The sync string of the projects. If the server has a different sync
         * string, then the projects list needs to be updated.
         */
        this._projectsSync = null;

        /**
         * This callback function gets called with updated projects whenever
         * the projects gets synced with the server.
         */
        this.onUpdatedProjects = null;
    }

    /**
     * Syncs the projects with the server asynchronously. After finished
     * synching with the server, the callback onUpdatedProjects and the given
     * callback will be called with the updated projects.
     *
     * @param callback Optional. A function that gets the projects.
     * @param force    Optional. When true, gets the projects from the server
     *                 even if already synced.
     */
    syncProjects(callback, force = false) {
        const _getProjects = () => {
            const projectsReq = this.#createRequest("GET", "/projects");
            projectsReq.onload = () => {
                if (projectsReq.status !== 200) {
                    console.error(projectsReq);
                    return;
                }

                const response = JSON.parse(projectsReq.responseText);
                this._projects = response.projects;
                this._projectsSync = response.sync;

                callback?.(this._projects);
                this.onUpdatedProjects?.(this._projects);
            }
            projectsReq.send();
        };

        // If not forced, checks if already have cached projects.
        if (force || !this._projectsSync) {
            _getProjects();
            return;
        } 

        // Already have cached projects, therefore, checks if needs to sync.
        const syncReq = this.#createRequest("GET", "/projects/sync");
        syncReq.onload = () => {
            if (syncReq.status !== 200) {
                console.error(projectsReq);
                return;
            }

            if (this._projectsSync === syncReq.responseText) {
                // Doesn't need to sync.
                callback?.(this._projects);
                this.onUpdatedProjects?.(this._projects);
                return;
            }

            // Needs to sync.
            _getProjects();
        };
        syncReq.send();
    }

    /**
     * Updates a give project in the server asynchronously. If the projects
     * aren't synced, then they get synced. After the project gets updated, the
     * give callback gets called.
     *
     * If the project cannot be found, then the onmissing callback gets called.
     *
     * @param project The project to update. This object must contain id,
     *                title and description.
     * @param callback Optional. A function that gets the updated project.
     * @param onmissing  Optional. A function that get no arguments.
     */
    updateProject(project, callback, onmissing) {
        const updateReq = this.#createRequest("PUT", "/projects/update/");
        updateReq.onload = () => {
            if (updateReq.status === 404) {
                onmissing?.();
                return;
            }
            if (updateReq.status !== 200) {
                console.error(updateReq);
                return;
            }

            // Check if needs to sync the project or only change the updated
            // project.
            const {oldSync, newSync} =
                JSON.parse(updateReq.responseText);
            if (oldSync !== this._projectsSync) {
                // Current cached projects are not synced with the server.
                this.syncProjects(null, true);
            } else {
                // Only updating the current project instead of sending a new
                // request to sync the projects.
                for (const p of this._projects) {
                    if (p.id === project.id) {
                        p.title = project.title;
                        p.description = project.description;
                    }
                }
                this._projectsSync = newSync;
                this.onUpdatedProjects?.(this._projects);
            }
            callback?.(project);
        };
        updateReq.send(JSON.stringify(project));
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
