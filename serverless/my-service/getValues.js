'use strict';

const Redis = require('redis');
const Massive = require('massive');
const config = require('./config.js');
const righto = require('righto');

const db = Massive.connectSync(config.thirdParty.rdsPostgreSQL);
const client = Redis.createClient(config.thirdParty.ElastiCacheRedis);

const successResponse = {
	statusCode: '200',
	body: {
		message: 'Data saved'
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

const getPostgresValues = righto((errback) => {
	db.run('select * from mytable', errback);
});
const getRedisValues = righto((errback) => {
	client.on('connect', () => {
		client.get('valueForRedis', errback);
	});
});

module.exports.getValues = (e, ctx, cb) => {
	righto.all([getRedisValues, getPostgresValues])((err, result) => {
		if (err) {
			ctx.fail(unsuccessResponse);
			return;
		}
		redisResult = result[0];
		postgresResult = result[1];
		successResponse.body.result = {
			postgresResult,
			redisResult,
		};
		ctx.succeed(successResponse);
	});
};
