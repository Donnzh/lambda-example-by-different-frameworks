'use strict';

console.log('starting function')
const config = require('config')
const postgresDbConfig = config.get('Postgres.dbConfig');
const redisDbConfig = config.get('Redis.dbConfig');

const redis = require('redis');
const client = redis.createClient(redisDbConfig);

const massive = require('massive');
const db = massive.connectSync(postgresDbConfig);

let successResponse = {
	statusCode: '200',
	body: {
		message: 'OK'
	},
	headers: {
		'Content-Type': 'application/json',
	}
};

const unsuccessResponse = {
	statusCode: '400',
	body: {
		message: 'Error happend'
	},
	headers: {
		'Content-Type': 'application/json',
	}
};

let postgresResult;
let redisResult;

exports.handler = function (e, ctx, cb) {

	db.run('select * from mytable', function (err, res) {
		if (err) {
			ctx.fail(unsuccessResponse, err);
		} else {
			postgresResult = res;
		}
	});
	client.on('connect', function () {
		console.log('redis connected');
	});
	client.get('valueForRedis', (err, res) => {
		if (err) {
			ctx.fail(unsuccessResponse, err);
		} else {
			redisResult = res;
			successResponse.body.result = {
				postgresResult,
				redisResult,
			};
			ctx.succeed(successResponse);
		}
	});
};
