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
         * Object containing lists of all the projects' synced tasks from the
         * server.
         */
        this._tasks = {};

        /**
         * The sync strings of all the projects' tasks. If the server has a
         * different sync string, then the project's tasks list needs to be
         * updated.
         */
        this._tasksSync = {};

        /**
         * This callback function gets called with updated projects whenever
         * the projects gets synced with the server.
         */
        this.onUpdatedProjects = null;

        /**
         * This callback function gets called with a project id and the
         * project's updated tasks whenever the project's tasks gets synced
         * with the server.
         */
        this.onUpdatedTasks = null;
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
                console.error(syncReq);
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
     * Updates a given project in the server asynchronously. If the projects
     * aren't synced, then they get synced. After the project gets updated, the
     * given callback gets called.
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
     * Deletes a given project from the server asynchronously. If the projects
     * aren't synced, then they get synced.
     *
     * @param projectId The id of the project to delete.
     */
    deleteProject(projectId) {
        const deleteReq = this.#createRequest("DELETE",
            `/projects/${projectId}`);
        deleteReq.onload = () => {
            if (deleteReq.status !== 200) {
                console.error(deleteReq);
                return;
            }

            // Check if needs to sync the project or only remove the deleted
            // project from the cached list.
            const {oldSync, newSync} =
                JSON.parse(deleteReq.responseText);
            if (oldSync !== this._projectsSync) {
                // Current cached projects are not synced with the server.
                this.syncProjects(null, true);
            } else {
                // Only remove the deleted project instead of sending a new
                // request to sync the projects.
                this._projects = this._projects.filter(
                    p => p.id !== projectId);
                this._projectsSync = newSync;
                this.onUpdatedProjects?.(this._projects);
            }
        };
        deleteReq.send();
    }

    /**
     * Creates a new project with a default title in the server asynchronously.
     * If the projects aren't synced, then they get synced. After the project
     * gets created, the given callback gets called.
     *
     * @param callback Optional. A function that gets the new project.
     */
    createNewProject(callback) {
        const newProject = {
            title: "New Project",
            description: "",
        };
        const createReq = this.#createRequest("POST", "/projects/new");
        createReq.onload = () => {
            if (createReq.status !== 201) {
                console.error(createReq);
                return;
            }

            // Gets the id of the new created project. Also, checks if need to
            // sync the project or only add the new project to the cached list.
            const {projectId, oldSync, newSync} =
                JSON.parse(createReq.responseText);
            newProject.id = projectId;
            callback?.(newProject);
            if (oldSync !== this._projectsSync) {
                // Current cached projects are not synced with the server.
                this.syncProjects(null, true);
            } else {
                // Only adds the new project instead of sending a new request
                // to sync the projects.
                this._projects.push(newProject);
                this._projectsSync = newSync;
                this.onUpdatedProjects?.(this._projects);
            }
        };
        createReq.send(JSON.stringify(newProject));
    }

    /**
     * Syncs the tasks of a given project with the server asynchronously.
     * After finished synching with the server, the callback onUpdatedTasks and
     * the given callback will be called with the updated tasks.
     *
     * @param projectId The project to sync its tasks.
     * @param callback  Optional. A function that gets the project id and the
     *                  tasks.
     * @param force     Optional. When true, gets the tasks from the server
     *                  even if already synced.
     */
    syncTasks(projectId, callback, force = false) {
        const _getTasks = () => {
            const tasksReq = this.#createRequest("GET",
                `/tasks?parent=${projectId}`);
            tasksReq.onload = () => {
                if (tasksReq.status !== 200) {
                    console.error(tasksReq);
                    return;
                }

                const response = JSON.parse(tasksReq.responseText);
                this._tasks[projectId] = response.tasks;
                this._tasksSync[projectId] = response.sync;

                callback?.(projectId, this._tasks[projectId]);
                this.onUpdatedTasks?.(projectId, this._tasks[projectId]);
            }
            tasksReq.send();
        };

        // If not forced, checks if already have cached tasks.
        if (force || !this._tasksSync[projectId]) {
            _getTasks();
            return;
        } 

        // Already have cached tasks, therefore, checks if needs to sync.
        const syncReq = this.#createRequest("GET",
            `/tasks/sync?parent=${projectId}`);
        syncReq.onload = () => {
            if (syncReq.status !== 200) {
                console.error(syncReq);
                return;
            }

            if (this._tasksSync[projectId] === syncReq.responseText) {
                // Doesn't need to sync.
                callback?.(projectId, this._tasks[projectId]);
                this.onUpdatedTasks?.(projectId, this._tasks[projectId]);
                return;
            }

            // Needs to sync.
            _getTasks();
        };
        syncReq.send();
    }

    /**
     * Creates a new task in a given project with a default title in the server
     * asynchronously. If the project's tasks aren't synced, then they get
     * synced. After the task gets created, the given callback gets called.
     *
     * @param projectId The id of the project that will get the new task.
     * @param callback Optional. A function that gets the new task.
     */
    createNewTask(projectId, callback) {
        const newTask = {
            title: "New Task",
            description: "",
            parent: projectId,
        };
        const createReq = this.#createRequest("POST", "/tasks/new");
        createReq.onload = () => {
            if (createReq.status !== 201) {
                console.error(createReq);
                return;
            }

            // Gets the id of the new created task. Also, checks if need to
            // sync the project's tasks or only add the new task to the cached
            // list.
            const {taskId, oldSync, newSync} =
                JSON.parse(createReq.responseText);
            newTask.id = taskId;
            callback?.(newTask);
            if (true || oldSync !== this._tasksSync[projectId]) {
                // Current cached project's tasks are not synced with the
                // server.
                this.syncTasks(projectId, null, true);
            } else {
                // Only adds the new task instead of sending a new request
                // to sync the project's tasks.
                this._tasks[projectId].push(newTask);
                this._tasksSync[projectId] = newSync;
                this.onUpdatedTasks?.(projectId, this._tasks[projectId]);
            }
        };
        createReq.send(JSON.stringify(newTask));
    }

    /**
     * Completes a given task in the server asynchronously. If the tasks of the
     * given task's project aren't synced, then they get synced.

     *
     * @param projectId The task's parent.
     * @param taskId The task to complete.
     * @param callback Optional. A function that gets called after the task is
     *                 completed.
     */
    completeTask(projectId, taskId, callback) {
        const completeReq = this.#createRequest("PUT",
            `/tasks/complete/${taskId}`);
        completeReq.onload = () => {
            if (completeReq.status !== 200) {
                console.error(completeReq);
                return;
            }

            // Check if needs to sync the tasks or only remove the completed
            // task from the cached list.
            const {oldSync, newSync} =
                JSON.parse(completeReq.responseText);
            if (oldSync !== this._tasksSync[projectId]) {
                // Current cached tasks are not synced with the server.
                this.syncTasks(projectId, null, true);
            } else {
                // Only remove the completed task instead of sending a new
                // request to sync the tasks.
                this._tasks[projectId] = this._tasks[projectId].filter(
                    t => t.id !== taskId);
                this._tasksSync[projectId] = newSync;
                this.onUpdatedTasks?.(projectId, this._tasks[projectId]);
            }
        };
        completeReq.send();
    }

    /**
     * Deletes a given task from the server asynchronously. If the tasks of the
     * given task's project aren't synced, then they get synced.

     *
     * @param projectId The task's parent.
     * @param taskId The task to delete.
     * @param callback Optional. A function that gets called after the task is
     *                 deleted.
     */
    deleteTask(projectId, taskId, callback) {
        const deleteReq = this.#createRequest("DELETE",
            `/tasks/${taskId}`);
        deleteReq.onload = () => {
            if (deleteReq.status !== 200) {
                console.error(deleteReq);
                return;
            }

            // Check if needs to sync the tasks or only remove the deleted task
            // from the cached list.
            const {oldSync, newSync} =
                JSON.parse(deleteReq.responseText);
            if (oldSync !== this._tasksSync[projectId]) {
                // Current cached tasks are not synced with the server.
                this.syncTasks(projectId, null, true);
            } else {
                // Only remove the deleted task instead of sending a new
                // request to sync the tasks.
                this._tasks[projectId] = this._tasks[projectId].filter(
                    t => t.id !== taskId);
                this._tasksSync[projectId] = newSync;
                this.onUpdatedTasks?.(projectId, this._tasks[projectId]);
            }
        };
        deleteReq.send();
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
