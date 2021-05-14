import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();


const pgp: pgPromise.IMain = pgPromise({});
const client = pgp(process.env.PSQL_CONNECTION_STRING);

export default client