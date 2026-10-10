const { Sequelize } = require('sequelize');
require('pg'); // Force inclusion for Vercel
require('pg-hstore'); // Force inclusion for Vercel
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

if (!process.env.DATABASE_URL) {
    console.error('\n============================================================');
    console.error('FATAL CONFIGURATION ERROR: DATABASE_URL is not defined!');
    console.error('Hisabi requires a PostgreSQL database connection string to start.');
    console.error('In Render: Go to your Web Service -> Environment -> Add Environment Variable');
    console.error('  Key:   DATABASE_URL');
    console.error('  Value: postgresql://<user>:<password>@<host>/<database>?sslmode=require');
    console.error('============================================================\n');
    process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: process.env.NODE_ENV === 'production' ? {
        ssl: {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        }
    } : {}
});

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, testConnection };
