'use strict';

const childProcess = require('child_process');
const fs = require('fs');
// const config = require('./config.js');
const config = require('config');

const env = Object.assign({}, process.env, {
	AWS_ACCESS_KEY_ID: config.thirdParty.awsLambda.accessKeyId,
	AWS_SECRET_ACCESS_KEY: config.thirdParty.awsLambda.secretAccessKey,
	AWS_REGION: config.thirdParty.awsLambda.region,
});

const args = process.argv.splice(2);
let command = `apex ${args.join(' ')}`;

console.log({ args, command });

childProcess.spawn('sh', ['-c', command], {
	env,
	stdio: 'inherit',
}).on('close', (childProcessExitCode) => {
	process.exit(childProcessExitCode);
});
