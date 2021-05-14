import IEntity from '../entities/entity';
import pgPromise from 'pg-promise';
import dbconnector from '../data/dbconnector';

interface IRepository<T extends IEntity> {
    db: typeof dbconnector;
    tableName: string;
    getAll(entity?: T): Promise<T[]>;
    get(entity: T): Promise<T>;
    add(entity: T): Promise<T>;
    update(changes: T, where: T): Promise<T[]>;
    delete(entity: T): Promise<pgPromise.IResultExt>;
};

class Repository<T> implements IRepository<T> {
    db: typeof dbconnector;
    tableName: string;


    constructor(tableName: string) {
        this.db = dbconnector;
        this.tableName = tableName;
    }

    getAll = (entity?: T): Promise<T[]> => {
        if (!entity) {
            return this.db.manyOrNone<T>(`SELECT * FROM ${this.tableName};`);
        }
        let keys: string[];
        let params: any[];
        let placeholders: string[];
        [keys, params, placeholders] = this.getParamValues(entity);

        if (keys.length > 0) {
            return this.db.manyOrNone<T>(
                `SELECT *
                FROM    ${this.tableName}
                WHERE   ${placeholders.join(' AND ')};`,
                entity
            );
        }
        return this.db.manyOrNone<T>(`SELECT * FROM ${this.tableName};`);
    }

    get = (entity: T): Promise<T> => {
        if (!entity) {
            return this.db.oneOrNone<T>(`SELECT * FROM ${this.tableName};`);
        }

        let keys: string[];
        let params: any[];
        let placeholders: string[];
        [keys, params, placeholders] = this.getParamValues(entity);

        if (keys.length > 0) {
            const sql =
                `SELECT *
                FROM    ${this.tableName}
                WHERE   ${placeholders.join(' AND ')};`
                console.log(sql);
                console.log(entity);

            return this.db.oneOrNone<T>(sql, entity);
        }
        return this.db.oneOrNone<T>(`SELECT * FROM ${this.tableName};`);
    }

    add = (entity: T): Promise<T> => {
        let keys: string[];
        let params: any[];
        let placeholders: string[];
        [keys, params, placeholders] = this.getParamValues(entity, 'insert');

        const sql =
            `INSERT INTO ${this.tableName} (
                ${keys.join(',')}
            ) VALUES (
                ${placeholders.join(',')}
            )
            RETURNING *;`;

        return this.db.oneOrNone<T>(sql, entity);
    }

    update = (changes: T, where: T): Promise<T[]> => {
        let cKeys: string[];
        let params: any[];
        let cPlaceholders: string[];
        [cKeys, params, cPlaceholders] = this.getParamValues(changes, 'update');

        let wKeys: string[];
        let wParams: any[];
        let wPlaceholders: string[];
        [wKeys, wParams, wPlaceholders] = this.getParamValues(where, 'update', cKeys.length);

        params.push(...wParams);

        const sql =
            `UPDATE ${this.tableName}
            SET     ${cPlaceholders.join(',')}
            WHERE   ${wPlaceholders.join(' AND ')}
            RETURNING *;`

        return this.db.manyOrNone<T>(sql, params);
    }

    delete = (entity: T): Promise<pgPromise.IResultExt> => {
        let keys: string[];
        let params: any[];
        let placeholders: string[];
        [keys, params, placeholders] = this.getParamValues(entity);

        return this.db.result(
            `DELETE FROM ${this.tableName}
            WHERE   ${placeholders.join(' AND ')};`, entity);
    }

    protected getParamValues = (entity: any, type: string='other', offset: number=0): [string[], any[], string[]] => {
        const keys: string[] = [];
        const params: any[] = [];
        const placeholders: string[] = [];

        if (!entity) {
            return [keys, params, placeholders];
        }

        Object.keys(entity).forEach((key: string) => {
            keys.push(key);
            switch (type) {
                case 'insert':
                    placeholders.push(`$(${key})`);
                    break;
                case 'update':
                    params.push(entity[key]);
                    placeholders.push(`${key}=$${keys.length + offset}`);
                    break;
                default:
                    placeholders.push(`${key}=$(${key})`);
                    break;
            }
        });

        return [keys, params, placeholders];
    }
}

export default Repository