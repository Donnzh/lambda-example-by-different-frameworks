'use strict';

const Redis = require('redis');
const Massive = require('massive');
const righto = require('righto');

const config = require('./config.js');
const db = Massive.connectSync(config.thirdParty.rdsPostgreSQL);
const client = Redis.createClient(config.thirdParty.ElastiCacheRedis);

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

function saveRedis(value, errback) {
	client.on('connect', function () {
		console.log('redis connected');
		client.set('valueForRedis', value, (err, reply) => {
			errback(err, value);
		});
	});
}

function savePostgres(value, errback) {
	let writeValue = {
		valueForPostgres: value,
	};
	db.saveDoc('mytable', writeValue, errback);
}

exports.handler = (e, ctx, cb) => {
	console.log('processing event: %j', {e});
	if (Object.keys(e).length !== 0 && e.constructor === Object) {

		const rightoFunctions = Object.keys(e).map(function (key) {
			let rightoFunction;
			switch (key) {
			case 'valueForRedis':
				rightoFunction = saveRedis;
				break;
			case 'valueForPostgres':
				rightoFunction = savePostgres;
				break;
			}
			return righto(rightoFunction, e[key]);
		});
		console.log('rightoFunctions',rightoFunctions);
		righto.all(rightoFunctions)(function (err, result) {
			if (err) {
				ctx.fail(unsuccessResponse);
				return;
			}

			successResponse.body.result = {};
			Object.keys(e).forEach((key, idx) => {
				successResponse.body.result[key+'Result'] = result[idx];
			});
			ctx.succeed(successResponse);
		});
	} else {
		console.log('event is missing');
		ctx.done();
	}

};
