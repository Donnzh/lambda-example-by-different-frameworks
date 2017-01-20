// exports.handler = function (event, context) {
// 	console.log(event);
// 	context.succeed('hello ' + event.name);
// };


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

exports.handler = (e, ctx) => {
	righto.all([getRedisValues, getPostgresValues])((err, result) => {
		if (err) {
			console.log(err);
			ctx.fail(unsuccessResponse);
			return;
		}
		redisResult = result[0];
		postgresResult = result[1];
		console.log('result',result);
		successResponse.body.result = {
			postgresResult,
			redisResult,
		};
		ctx.succeed(successResponse);
	});
};
