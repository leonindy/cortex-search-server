#!/usr/bin/env node --harmony

var optimist = require('optimist'),
    fs = require('fs'),
    domain = require('domain'),
    path = require('path'),
    cluster = require('cluster'),
    env = process.env.NODE_ENV || 'development';

// parse arguments
var argv = optimist.usage('Usage $0 [-p|--port <port>]')
    .alias('p', 'port')
    .describe('running in port')
    .alias('c', 'config')
    .describe('load config file')
    .boolean('cluster')
    .describe('start server with cluster')
    .argv;


// Load config
var config = argv.config ? path.join(process.cwd(), argv.config) : ('./config.');

config = require(config);

if (argv.hasOwnProperty('cluster')) {
    config.cluster = argv.cluster;
}

var app = require('../lib');
var port = argv.port || config.port || 8010;

if (config.cluster) {
    if (cluster.isMaster) {
        // Fork workers.
        for (var i = 0; i < numCPUs; i++)
            cluster.fork();

        cluster.on('exit', function(worker, code, signal) {
            console.error('worker ' + worker.process.pid + ' crashed');
        });
    } else {
        app.listen(port);
        console.log(config.name + ' is listening to port: ' + port + '...');

        app.on('close', function() {
            console.error('server crashed, it will be restart in 5 seconds...');
            var i = 5;
            setTimeout(function() {
                --i;
                console.error(i + '...');
                if (i === 0) {
                    app.listen(port);
                    console.log(config.name + ' is listening to port: ' + port + '...');
                }

            }, 1000);
        });
    }
} else {
    var d = domain.create();

    d.on('error', function(e) {
        console.error(config.name + ' encounter error: ', e);
    });

    d.run(function() {
        app.listen(port);
        console.log(config.name + ' is listening to port: ' + port + '...');
    });
}