import dotenv from "dotenv";
import express from "express";
import path from "path";
import * as routes from "./routes";
import cors from 'cors';
import pool from './common/data/dbconnector';
import * as https from 'https';
import * as fs from 'fs';
import handlebars from 'express-handlebars';
import morgan from 'morgan';
import errorHandler from './middleware/errorHandler';

dotenv.config();

const port = process.env.SERVER_PORT;
const sslport = process.env.SERVER_SSL_PORT;
const app = express();

// set up logs
// access log
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/../logs/access.log'), { flags: 'a' });
app.use(morgan('combined', {
    skip: (req: express.Request, res: express.Response) => { return req.originalUrl.startsWith('/public') },
    stream: accessLogStream
}));
// error log
const errorLogStream = fs.createWriteStream(path.join(__dirname, '/../logs/error.log'), { flags: 'a' });
app.use(morgan('combined', {
    skip: (req: express.Request, res: express.Response) => { return res.statusCode < 400 },
    stream: errorLogStream
}));
// set up cors
app.use(cors());
app.use(express.json());

// error handler
app.use(errorHandler);
// sse
let clients: {id: number, res: express.Response }[] = [];
app.get('/events', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);
    res.write('event: init\n');
    res.write('data: init\n\n');
    const clientId = Date.now();
    const newClient = {id: clientId, res};
    clients.push(newClient);

    req.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
    });
});
// you can find app instance inside req, so to call sendEventstToAll outside
// this file (f.ex. in a controller file) you can do:
// req.app.locals.sendEventsToAll(JSON.stringify(content), 'message');
app.locals.sendEventsToAll = (data: string, event?: string) => {
    clients.forEach(client => {
        if (event) {
            client.res.write(`event: ${event}\n`);
        }
        client.res.write(`data: ${data}\n\n`);
    });
}
// set up wiews and rendering engine
app.set("views", path.join(__dirname, "views"));
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");
// set static dir name and path
app.use("/public", express.static(path.join(__dirname, "public")));
// Configure routes
routes.register(app);

if (process.env.ENABLE_SSL === '1') {
    const key = fs.readFileSync(__dirname + '/crt/key-rsa.pem');
    const cert = fs.readFileSync(__dirname + '/crt/cert.pem');
    const server = https.createServer({ key, cert }, app);
    server.listen(sslport, () => {
        pool.connect((err, client, done) => {
            if (err) throw new Error(err.message);
        });
    });
} else {
    app.listen(port, () => {
        pool.connect((err, client, done) => {
            if (err) throw new Error(err.message);
        });
    });
}

