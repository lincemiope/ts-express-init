import { Request, Response, NextFunction } from 'express'

function errorHandler (err: Error, req: Request, res: Response, next: NextFunction) {
    if (res.headersSent) {
        next(err);
        return;
    }
    if (process.env.NODE_ENV === 'development') {
        res.status(500).send(err.stack)
    } else {
        res.status(500).send(err.message)
    }
}

export default errorHandler