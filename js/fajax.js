/**
 * This file contains a fake AJAX (FAJAX) system. The FAJAX system has the
 * following classes:
 * * Network: Creates a fake network to transfer Http requests and responses
 *            between the client and the server.
 * * FXMLHttpRequest: Creates a fake Http request and response using Network.
 *
 * @file fajax.js
 */

"use strict";

/**
 * Network is a static class that creates a fake network. Before using it, the
 * class must contain a server using the function Network.setServer().
 */
class Network {
    /**
     * Sets the network's server to receive a fake http request and respond to
     * it.
     *
     * @param server An object with the function handle(FXMLHttpRequest).
     */
    static setServer(server) {
        Network.server = server
        Network.mode = 1;
    }

    /**
     * Sends the request to the server. The server's respond will be transfered
     * using the callback.
     *
     * @param request FXMLHttpRequest object filled with a request to the
     *                server
     * @param callback Function object that will be called after the server's
     *                 response with FXMLHttpRequest that contains the
     *                 response.
     */
    static send(request, callback) {
        const timeToWait = Math.random() * (Network._maxMs - Network._minMs) +
            Network._minMs;
        setTimeout(() => {
            // The server will write its respond in the request object.
            Network.server.handle(request);
            callback(request);
        }, timeToWait);
    }

    /**
     * Sets the network "slowness" mode. It can be one of the following modes:
     * * 0 - Local: Waits 0ms for the response.
     * * 1 - Neighbour [default]: Waits between 75ms to 200ms for the
     *                            response.
     * * 2 - Abroad: Waits between 200ms to 1500ms for the response.
     * * 3 - Far Far Away: Waits between 2500ms to 10000ms for the response.
     *
     * @param mode The wanted mode from 0 to 3.
     */
    static set mode(mode) {
        switch (mode) {
            case 0:
                Network._mode = 0;
                Network._minMs = 0;
                Network._maxMs = 0;
                return;
            case 2:
                Network._mode = 2;
                Network._minMs = 200;
                Network._maxMs = 1500;
                return;
            case 3:
                Network._mode = 3;
                Network._minMs = 2500;
                Network._maxMs = 10000;
                return;
            default:
            case 1:
                Network._mode = 1;
                Network._minMs = 75;
                Network._maxMs = 200;
                return;
        }
    }
}

/**
 * FXMLHttpRequest handles client's fake Http requests and sends them to a fake
 * network system.
 *
 * The class implements the following features from XMLHttpRequest:
 * Methods:
 * * Default constructor
 * * open(method, url)
 * * setRequestHeader(header, value)
 * * addEventListener("load", callback)
 * * send(body)
 * * getResponseHeader(header)
 *
 * Properties:
 * * onload
 * * readyState
 * * status
 * * statusText
 * * responseText
 *
 * For the server, this class implements the following methods and properties:
 * * method
 * * url
 * * getRequestHeader(header)
 * * setStatus(status, statusText)
 * * addResponseHeader(header, value)
 * * responseText
 */
class FXMLHttpRequest extends EventTarget {
    /**
     * Creates a new Http request.
     */
    constructor() {
        super();

        /**
         * The state of the current object. Can be one of the following states:
         * 0 - UNSET: open() wasn't called yet.
         * 1 - OPENED: open() has been called.
         * 2 - HEADERS_RECEIVED: send() has been called, and headers and status
         *                       are available.
         * 3 - LOADING: Not used.
         * 4 - DONE: The operation is complete.
         * 5 - RESPONSE: In the server, getting response.
         */
        this.readyState = 0;

        this.loadEvent = new Event("load");
        this.addEventListener("load", (ev) => {
            if (this.onload) {
                this.onload(ev);
            }
        });
    }

    /**
     * Initinalizes a new request or an existing one.
     *
     * @param method The Http request method.
     * @param url The url to send this request.
     */
    open(method, url) {
        this.method = method;
        this.url = url;
        this.body = null;
        this.readyState = 1;
        this.requestHeaders = {};

        this.status = undefined;
        this.statusText = undefined;
        this.responseHeaders = {};
        this.responseText = undefined;
    }

    /**
     * Adds a request header to this request. Can be used only after calling
     * open and before calling send. Nothing will happend if was called in
     * another state.
     *
     * @param header The header's key
     * @param value The header's value.
     */
    setRequestHeader(header, value) {
        if (this.readyState === 1) {
            this.requestHeaders[header] = value;
            return;
        }

        console.error(
            "Used FXMLHttpRequest.setResponseHeader() in wrong state");
    }

    /**
     * Sends the Http request to the url and waits asynchronously to the
     * response from the server. After the response arrives, the event 'load'
     * gets dispatched.
     *
     * Can be called only after open, or otherwise, an exception will be
     * thrown.
     *
     * @param body (Optional) The Http request's body. Will get ignored if the
     *             method is GET or HEAD.
     */
    send(body) {
        if (this.readyState !== 1) {
            throw new Error("Called FXMLHttpRequest.send() in wrong state");
        }

        if (this.method !== "GET" && this.method !== "HEAD") {
            this.body = body.toString();
        }

        this.readyState = 2;

        Network.send(this.#createResponse(), (response) => {
            // Copy the response's data, so the user will be able to access it.
            this.status = response.status;
            this.statusText = response.statusText;
            this.responseHeaders = response.responseHeaders;
            this.responseText = response.responseText;

            this.readyState = 4;

            this.dispatchEvent(this.loadEvent);
        });
    }

    /**
     * Returns a string containing the response header's value or null if the
     * header wasn't found.
     */
    getResponseHeader(header) {
        if (this.readyState < 4 || !this.responseHeaders[header]) {
            return null;
        }

        return this.responseHeaders[header];
    }

    /**
     * Returns a string containing the request header's value or null if the
     * header wasn't found. This function works only at the server, or it will
     * return null.
     */
    getRequestHeader(header) {
        if (this.readyState !== 5 || !this.requestHeaders[header]) {
            return null;
        }

        return this.requestHeaders[header];
    }

    /**
     * Sets the response status. Can be used only in the server. Nothing will
     * happend if it was called in the client.
     *
     * If the statusText parameter is undefined or null, then it will be
     * inferred from the status code for the next status codes:
     * * 200: OK
     * * 201: Created
     * * 400: Bad Request
     * * 401: Unauthorized
     * * 403: Forbidden
     * * 404: Not Found
     * * 500: Internal Error
     * * 501: Not Implemented
     * Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
     *
     * If the status code is not from the above, then the statusText will be an
     * empty string.
     *
     * @param status The integer status of the http response.
     * @param statusText Optional. The string message of the http response.
     */
    setStatus(status, statusText) {
        if (this.readyState !== 5) {
            console.error("Used FXMLHttpRequest.setStatus() in client");
            return;
        }

        this. status = status;
        if (statusText === undefined || statusText === null) {
            const statusTexts = {
                200: "OK",
                201: "Created",
                400: "Bad Request",
                401: "Unauthorized",
                403: "Forbidden",
                404: "Not Found",
                500: "Internal Error",
                501: "Not Implemented",
            }
            statusText = statusTexts[status] ?? "";
        }
        this.statusText = statusText.toString();
    }

    /**
     * Adds a response header to this response. Can be used only in the server.
     * Nothing will happend if it was called in the client.
     *
     * @param header The header's key
     * @param value The header's value.
     */
    setResponseHeader(header, value) {
        if (this.readyState === 5) {
            this.responseHeaders[header] = value;
            return;
        }
        console.error("Used FXMLHttpRequest.setResponseHeader() in client");
    }

    /**
     * Creates a copy of the request to send to the server.
     */
    #createResponse() {
        const response = new FXMLHttpRequest();
        response.readyState = 5;
        response.method = this.method;
        response.url = this.url;
        response.requestHeaders = this.requestHeaders;
        response.body = this.body;
        response.responseHeaders = {};
        response.responseText = null;
        return response;
    }
}
