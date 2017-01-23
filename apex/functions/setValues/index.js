'use strict';

console.log('starting function')
const config = require('config');
const postgresDbConfig = config.get('Postgres.dbConfig');
const redisDbConfig = config.get('Redis.dbConfig');

const redis = require('redis');
const client = redis.createClient(redisDbConfig);

const massive = require('massive');
const db = massive.connectSync(postgresDbConfig);

const righto = require('righto');


let successResponse = {
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

function setValueRedis(value, errback){
	client.on('connect', function () {
		console.log('redis connected');
		client.set('valueForRedis', value, (err, reply) => {
			errback(err, value);
		});
	});
}

function setValuePostgres(value, errback){
	let writeValue = {
		valueForPostgres: value,
	};
	db.saveDoc('mytable', writeValue, errback);
}

//delete all data from table
// function deleteVaulePostgres(errback){
// 	db.run('DELETE FROM mytable', errback);
// }

exports.handler = function (e, ctx, cb) {
	console.log('processing event: %j', {
		e
	});
	if (Object.keys(e).length !== 0 && e.constructor === Object) {

		const rightoFunctions = Object.keys(e).map((req) => {
			let rightoFunction;
			switch (req) {
			case 'valueForRedis':
				rightoFunction = setValueRedis;
				break;
			case 'valueForPostgres':
				rightoFunction = setValuePostgres;
				break;
			// case 'deleteAllDataInPostgres':
			// 	rightoFunction = deleteVaulePostgres;
			// 	break;
			}
			return righto(rightoFunction, e[req]);

		});
		console.log('rightoFunctions', rightoFunctions);

		righto.all(rightoFunctions)(function (err, result) {
			if (err) {
				ctx.fail(unsuccessResponse);
				return;
			}
			successResponse.body.result = {};
			Object.keys(e).forEach((key, idx) => {
				successResponse.body.result[key + 'Result'] = result[idx];
			});
			ctx.succeed(successResponse);
		});
	} else {
		console.log('event is missing');
		ctx.done();
	}
};
