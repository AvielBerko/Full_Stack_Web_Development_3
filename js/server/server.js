class Server {
    handle(request) {
        switch (request.url)  { // tolower
            case '/login':
                this.#login(request);
                break;
            case '/regiser':
                this.#register(request);
                break;
        }
    }
    #login()
    #register()
}