const chromeLauncher = require('chrome-launcher');
const axios = require('axios');
const httpProxy = require('http-proxy');
const express = require("express");
const fs = require("fs");
const app = express();
let portRange = [];
let proxyInstances = {}
let localAddress = '0.0.0.0';
const defaultFlags = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    //'--single-process',
    '--no-zygote',
    '--no-initial-navigation',
    '--headless',
    '--disable-dev-shm-usage'
];

app.get("/", (req, res, next) => {
    console.log('/');
    res.set('Content-Type', 'text/plain')
    res.send(fs.readFileSync('README.md'));
});

app.get("/launch", async (req, res, next) => {
    let chromeFlags = defaultFlags;
    if(portRange.length > 0) {
        if (req.query.args && req.query.args.length) {
            chromeFlags = chromeFlags.concat(req.query.args);
        }
        console.log(req.query)
        let proxyPort = portRange.pop();
        const chrome = await chromeLauncher.launch({chromeFlags});
        const response = await axios.get(`http://localhost:${chrome.port}/json/version`);
        const {webSocketDebuggerUrl} = response.data;
        let proxy = httpProxy.createServer({
            target: webSocketDebuggerUrl,
            ws: true,
            localAddress
        }).listen(proxyPort);

        proxyInstances[proxyPort] = proxy;

        proxy.on('close', function (res, socket, head) {
            proxy.close()
            delete proxyInstances[proxyPort];
            portRange.push(proxyPort);
            // view disconnected websocket connections
            console.log('Client disconnected. Port: %s', proxyPort);
        });

        res.json({
            browserWSPort: proxyPort,
            chromeFlags: chromeFlags.concat(chromeLauncher.Launcher.defaultFlags())
        });
    } else {
        res.json({
            error: 'All ports was occupied.'
        });
    }
});
app.get("/killall", async (req, res, next) => {
    console.log('KillAll');
    Object.values(proxyInstances).map((i) => i.close())
    proxyInstances = {}
    initPortRange();
    await chromeLauncher.killAll();
    res.json({'status':'ok'});
});

app.listen(3000,localAddress, () => {
    initPortRange();
    console.log("Server running on port 3000");
});

function initPortRange() {
    portRange = [];
    for (let i = 10000; i < 20000; i++) {
        portRange.push(i);
    }
}

process.on('SIGINT', function () {
    console.log('SIGINT');
    process.exit();
});