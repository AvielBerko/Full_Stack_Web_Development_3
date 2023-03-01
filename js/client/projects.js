/**
 * This file contains the implementation of the class ProjectsPage. The
 * projects page from the SPA system displays the list of projects and the list
 * of tasks of each project.
 * 
 * @file projects.js
 */

"use strict";

/**
 * This page is a SPA system's page that displays the list of projects and
 * the list of tasks of each project.
 */
class ProjectsPage extends Page {
    constructor() {
        super("projects");

        this.projectTemplate = document.getElementById("template-project");
        if (!this.projectTemplate) {
            throw new Error("Missing a project template");
        }

        this.currentProject = null;
        this.editingProject = false;
    }

    enter(apiKey, ...args) {
        if (!App.context.todos || App.context.todos.apiKey !== apiKey) {
            if (!apiKey) {
                apiKey = "DEMO_KEY";
                /*this.navigate("login");
                return;*/
            }
            App.context.todos = new TodosContext(apiKey);
        }

        super.enter(...args);

        // Can be called only after super.enter() because only then the
        // template is being cloned into the DOM.
        this.projectsContainer = document.getElementById("projects-container");

        this.projectHeader = document.getElementById("project-header");
        this.projectTitle = document.getElementById("project-title");
        this.projectDesc = document.getElementById("project-desc");

        this.projectForm = document.getElementById("project-form");
        this.projectTitleInput =
            document.getElementById("project-title-input");
        this.projectDescInput = document.getElementById("project-desc-input");

        this.tasksList = document.getElementById("tasks-list");
        this.tasksContainer = document.getElementById("tasks-container");

        document.getElementById("project-delete").onclick = () => {
            this.deleteProject();
        };
        document.getElementById("project-start-edit").onclick = () => {
            this.setEditingProject(true);
        };
        document.getElementById("project-cancel-edit").onclick = () => {
            this.setEditingProject(false);
        };
        document.getElementById("project-submit-edit").onclick = () => {
            if (this.updateProject()) {
                this.setEditingProject(false);
            }
        };
        document.getElementById("project-new").onclick = () => {
            this.createNewProject();
        };

        document.getElementById("task-new").onclick = () => {
            this.createNewTask();
        }

        this.setCurrentProject(null);
        App.context.todos.onUpdatedProjects =
            proj => this.displayProjects(proj);
        App.context.todos.onUpdatedTasks =
            (proj, tasks) => console.log("New Tasks", proj, tasks);

        App.context.todos.syncProjects();
    }

    /**
     * Updates the html projects list to display the given projects. If no
     * project is selected or the selected project got deleted, then selects
     * the first project.
     *
     * @param projects The projects to display.
     */
    displayProjects(projects) {
        let currentProjectExists = false;
        const lastProjectId = this.currentProject?.id;

        this.projectsContainer.innerHTML = '';
        for (const project of projects) {
            // Creates a new project item in the list from the project
            // template.
            const projElem = this.projectTemplate.content.cloneNode(true);
            projElem.querySelector(".project-title").textContent
                = project.title;
            projElem.querySelector(".project-btn").onclick = ev => {
                this.setEditingProject(false);
                this.setCurrentProject(project);
            }
            this.projectsContainer.append(projElem);

            if (lastProjectId === project.id) {
                // Don't change editing mode if found last project.
                currentProjectExists = true;
                this.setCurrentProject(project);
            }
        }

        if (!currentProjectExists) {
            this.setEditingProject(false);
            this.setCurrentProject(projects[0]);
        }
    }

    /**
     * Updates the selected project after it got edited. This function
     * validates the new project.
     *
     * @return true if successfuly requested to edit or the project had no
     *         change. Otherwise, returns false.
     */
    updateProject() {
        if (!this.projectTitleInput.value) {
            alert("You must enter a title");
            return false;
        }

        if (this.projectTitleInput.value === this.currentProject.title &&
            this.projectDescInput.value === this.currentProject.description) {
            return true;
        }

        const updatedProject = {
            id: this.currentProject.id,
            title: this.projectTitleInput.value,
            description: this.projectDescInput.value,
        };
        App.context.todos.updateProject(updatedProject, null,
            () => {
                // Called when the project is missing. Probably because it got
                // deleted.
                App.context.todos.syncProjects();
                alert("The project got deleted while you were editing it")
            }
        );

        return true;
    }

    /**
     * Deletes the selected project from the server.
     */
    deleteProject() {
        App.context.todos.deleteProject(this.currentProject.id);
    }

    /**
     * Creates a new project, selects it and starts editing it. The project
     * is already being created in the server with a default title.
     */
    createNewProject() {
        App.context.todos.createNewProject(
            proj => {
                this.setCurrentProject(proj);
                this.setEditingProject(true);
            }
        );
    }

    /**
     * Creates a new task of the current project and starts editing it.
     * The task is already being created in the server with a default title.
     */
    createNewTask() {
        App.context.todos.createNewTask(this.currentProject.id,
            task => {
                // TODO: Start editing the task.
            }
        );
    }

    /**
     * Selects the given project to display its content.
     *
     * @param project The project to display, or null to display no project.
     */
    setCurrentProject(project) {
        if (!project) {
            this.currentProject = null;
            this.projectHeader.classList.add("hidden");
            this.tasksList.classList.add("hidden");
            return;
        }

        this.currentProject = project;
        this.projectTitle.textContent = this.currentProject.title;
        this.projectDesc.textContent = this.currentProject.description;
        this.projectTitleInput.value = this.currentProject.title;
        this.projectDescInput.value = this.currentProject.description;
        this.tasksList.classList.remove("hidden");
    }

    /**
     * Starts or stops editing the project.
     *
     * @param isEditing Boolean indicating if to start or stop editing.
     */
    setEditingProject(isEditing) {
        this.editingProject = isEditing;
        if (isEditing) {
            this.projectHeader.classList.add("hidden");
            this.projectForm.classList.remove("hidden");
        } else {
            this.projectHeader.classList.remove("hidden");
            this.projectForm.classList.add("hidden");
        }
    }
}
