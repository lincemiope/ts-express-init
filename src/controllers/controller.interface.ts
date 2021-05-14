import express from 'express';
import dbconnector from '../common/data/dbconnector';

interface IController {
    path: string;
    db: typeof dbconnector;
    router: express.Router;

    initRoutes(): void;
    registerRoutes(app: express.Application): void;
}

class Controller implements IController {
    path: string;
    db: typeof dbconnector;
    router: express.Router;

    constructor() {
        this.db = dbconnector
        this.initRoutes()
    }

    initRoutes() {
        // initRoutes()
    }

    registerRoutes(app: express.Application, baseAPIUrl?: string) {
        if (!baseAPIUrl) {
            baseAPIUrl = '';
        }
        app.use(baseAPIUrl + this.path, this.router);
    }
}

export default Controller;