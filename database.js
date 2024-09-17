// const mysql = require("mysql");

const mysql = require("mysql2");

require("dotenv").config();
// console.log(process.env.DB_PASS);

const pool = mysql.createPool({
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  password: '0Gloadmin123#$',
  database: process.env.MYSQL_DB,
  user: process.env.DB_USER,
  connectionLimit: 1000,
  waitForConnections: true,
  queueLimit: 0,
  timezone: "+01:00",
  connectTimeout: 99999,
  acquireTimeout: 90000,
  idleTimeout: 90000,
});

const promise_pool = pool.promise();

module.exports = { pool, promise_pool };
