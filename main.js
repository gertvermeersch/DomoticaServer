/**
 * Created by GeVr on 4/01/2015.
 */
var RestServer = require("./RESTserver.js");

var config = [
    {   description: "Turn twilight on",
        path: "/living/twilight/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "1"
        },
        room: "living",
        device: "twilight",
        state : "on"
    },
    {   description: "Turn twilight off",
        path: "/living/twilight/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "1"
        },
        room: "living",
        device: "twilight",
        state : "off"
    },
    {   description: "Turn scent on",
        path: "/bedroom/scent/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "5"
        },
        room: "bedroom",
        device: "scent",
        state : "on"
    },
    {   description: "Turn scent off",
        path: "/bedroom/scent/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "5"
        },
        room: "bedroom",
        device: "scent",
        state : "off"
    },
    {   description: "Turn desk light on",
        path: "/living/desklight/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "0"
        },
        room: "living",
        device: "desklight",
        state : "on"
    },
    {   description: "Turn desklight off",
        path: "/living/desklight/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "0"
        },
        room: "living",
        device: "desklight",
        state : "off"
    },
    {   description: "Turn salt lamp on",
        path: "/bedroom/saltlamp/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "4"
        },
        room: "living",
        device: "saltlamp",
        state : "on"
    },
    {   description: "Turn salt lamp off",
        path: "/bedroom/saltlamp/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "4"
        },
        room: "living",
        device: "saltlamp",
        state : "off"
    },
    {   description: "Turn uplighter on",
        path: "/living/uplighter/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "2"
        },
        room: "living",
        device: "uplighter",
        state : "on"
    },
    {   description: "Turn uplighter off",
        path: "/living/uplighter/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "2"
        },
        room: "living",
        device: "uplighter",
        state : "off"
    },
    {   description: "Turn twilights on",
        path: "/living/twilights/on",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWON",
            value: "3"
        },
        room: "living",
        device: "twilights",
        state : "on"
    },
    {   description: "Turn twilights off",
        path: "/living/twilights/off",
        message: {
            address: "0000",
            type: "command",
            parameter: "SWOF",
            value: "3"
        },
        room: "living",
        device: "twilights",
        state : "off"
    },



];

var port    =  '8443';
serverInstance = new RestServer(port);
serverInstance.setConfig(config);
serverInstance.setStates({
    living: {
        uplighter: "",
        twilight: "",
        twilights: "",
        desklight: "",
        temperature: ""
    },
    bedroom: {
        saltlamp: "",
        scent: ""
    }
});