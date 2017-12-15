'use strict';

const Path = require('path');
const Hapi = require('hapi');
//const Hoek = require('hoek');

const server = new Hapi.Server();

server.register(require('vision'), (err) => {

//    Hoek.assert(!err, err);

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: './templates',
	    layoutPath: './templates/layout',
	    helpersPath: './templates/helpers'
    });
});

server.connection({ port: 3001, host: 'localhost' });
server.route({
	method:'GET',
	path:'/',
	handler:{
		view:'index'
	}
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});