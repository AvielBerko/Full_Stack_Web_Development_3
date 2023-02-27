/**
 * This file contains the following items to manage the SPA system:
 * * Page abstract class to manage each page in the SPA system.
 * * App static class that manages the SPA navigation system.
 *
 * @file spa.js
 */

"use strict";

/**
 * This class is an abstract class that manages it's unique page in the SPA
 * system. Each page has its own template in the html DOM that can be
 * identified using the page's name.
 *
 * The way to inherit this class is the following:
 * * The new class should pass the page's name into the super constructor.
 * * A template with the id 'template-{page's name}' must exist in the html
 *   DOM.
 * * All navigable buttons can have the class '.spa-nav' for auto navigation.
 * * The function enter() can be overwritten, however, it must call
 *   super.enter().
 * * The function onNav() can be overwritten to control page navigation after a
 *   navigable button was clicked.
 * * The function clear() can be overwritten and is called just before
 *   navigating, however, it must call super.clear().
 * * Call navigate(page) to navigate into a different page.
 */
class Page extends EventTarget {
    /**
     * Initializes the page with a unique name. A template with the name
     * 'template-{page's name} must exist, or otherwise an exception will be
     * thrown.
     *
     * @note The constructor can be called only after the html DOM was loaded.
     *
     * @param name The new page's name.
     */
    constructor(name) {
        super();
        this.name = name;
        this.template = document.getElementById("template-" + this.name);
        if (!this.template) {
            throw new Error(`Page "${this.name}" missing a template.`);
        }
        this.exitEvent = new Event("exit");
    }

    /**
     * Displays the page in the html.
     */
    enter() {
        this.page = document.createElement("div");
        this.page.id = "page-" + this.name;
        document.body.append(this.page);
        this.page.append(this.template.content.cloneNode(true));

        document.querySelectorAll(".spa-nav").forEach((nav) => {
            nav.addEventListener("click", (ev) => {
                const navPage = this.onNav(ev);
                if (navPage) {
                    this.navigate(navPage);
                }
            });
        });
    }

    /**
     * Called after a navigable button was clicked to control into which page
     * to navigate, or to block the navigation.
     *
     * @param ev The click event object.
     * @return The page name to navigate into, or null to cancel navigation.
     */
    onNav(ev) {
    }

    /**
     * Navigate into a given page or the default page.
     *
     * @param page The page's name to navigate into, or null to navigate into
     *             the default page.
     */
    navigate(page) {
        this.clear();
        this.exitEvent.page = page;
        this.dispatchEvent(this.exitEvent);
    }

    /**
     * Removes the page's html content from the DOM.
     */
    clear() {
        this.page?.remove();
        this.page = undefined;
    }
}

/**
 * This static class manages the SPA navigation system. The function App.init()
 * must be called after the html DOM was loaded.
 */
class App {
    /**
     * Initializes the class's inner state and displays the default page.
     *
     * @note Must be called only after the html DOM was loaded.
     *
     * @param defaultPage String containing the default page's name.
     * @param pages Object containing all the initalized pages with key being
     *              the page's name and the value is the page's object. The
     *              default page must be in the object.
     */
    static init(defaultPage, pages) {
        App.pages = pages;
        App.defaultPage = defaultPage;

        // Hook the pages' exit event.
        Object.values(App.pages).forEach((page) => {
            page.addEventListener("exit", App.pageExit);
        });

        // Display the default page.
        App.currentPage = App.pages[App.defaultPage];
        App.currentPage.enter();
        history.replaceState({}, null, `#${App.currentPage.name}`);

        window.addEventListener("popstate", App.poppin);
    }

    /**
     * Handles the page navigation when the current page exists.
     *
     * @param ev The page's exit event.
     */
    static pageExit(ev) {
        App.currentPage = App.pages[ev.page ?? App.defaultPage] ??
                          App.pages[App.defaultPage];
        App.currentPage.enter();
        history.pushState({}, null, `#${App.currentPage.name}`);
    }

    /**
     * Handles the page navigation when the url is changed.
     */
    static poppin() {
        App.currentPage.clear();
        App.currentPage = App.pages[location.hash.replace("#", "")] ??
                          App.pages[App.defaultPage];
        App.currentPage.enter();
    }
}
