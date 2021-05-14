import { Application, Request, Response } from "express";

export const register = (app: Application) => {
    // home page
    app.get("/", (req: Request, res: Response) => {
        res.render('home', {
            pageTitle: 'Homepage',
            layout: 'main'
        });
    });
};
