
const testServer = {
    handle: function (request) {
        if (request.method === "GET") {
            request.setStatus(200);
            request.setResponseHeader("Test", "Value");
            request.setResponseHeader("Test1", "Value2");
            request.responseText =
                "{ \"Message\": \"This is a test json text\" }"
        } else {
            request.setStatus(501);
        }
    },
};

Network.setServer(testServer);
Network.mode = 2

const fxhr = new FXMLHttpRequest();

fxhr.open("GET", "/todos/lskdjflksjdfk=");

fxhr.setRequestHeader("TestR", "alueV");
fxhr.setRequestHeader("RestT", "Value");

fxhr.addEventListener("load", (ev) => { console.log(ev.target); });
fxhr.onload = (ev) => { console.log("loaded"); };

fxhr.setRequestHeader("Bdika", "Erech");

fxhr.send("This is a body");
