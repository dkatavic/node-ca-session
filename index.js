var moment = require('moment');
var crypto = require('crypto');
var client;

// default token life time. Token's duration is prolonged
// after each validation for the value of token_TTL
var token_TTL = 2 * 3600;
// tokens lenght in bytes
var token_bytes_length = 24;

var service = {

	validate: function(token, cb) {

		client.hgetall(token, function(err, session) {

			if (err) {
				return cb(err);
			}

			if (!session) {

				return cb("Invalid token");

			}

			if (session.user_id) {
				session.user_id = parseInt(session.user_id);
			}

			//
			// Prolong the sessions for token_TTL
			//
			client.expire(token, token_TTL);

			return cb(null, session);
			
		});

	},

	create: function(params, cb) {

		if (!params) {
			throw new Error("Invalid params");
		}

		var token = "";
		var i = 0, limit = 20;

		var generateUniqueToken = function(params) {

			if (i++ >= limit) {
				throw new Error("Can't generate unique token");
			}

			token = crypto.randomBytes(token_bytes_length).toString('hex');

			var result = client.hgetall(token, function(err, session) {
				
				if (err) {
					return cb(err);
				}
				
				if (session) {
					//	There is already specified token in DB, generate new one
					return generateUniqueToken(params);
				}
				
				if (!params.createdAt) {
					params.createdAt = moment().utc().format('YYYY-MM-DD HH:mm:ss');
				}

				client.hmset(token, params, function(err, data) {});

				//tokens are valid for token_TTL
				client.expire(token, token_TTL);

				// keep track of tokens for some user_id (so called redis custom idexing)
				// TODO: remove custom indexing in future version
				// TODO: if not removed, allow configuration of custom indexing during init
				if (params.user_id) {
					try {
						client.sadd('user_id:' + params.user_id, JSON.stringify({
							token: token,
							sid: params.sid,
						}));
						client.expire(token, token_TTL * 100);
					}
					catch (e) {}
				}

				params.user_id = parseInt(params.user_id);

				params.token = token;
				return cb(null, params);

			});
		};

		generateUniqueToken(params);

	},

};

var initialization = {

	init: function(params) {

		if (!params || !params.redis_client) {
			throw new Error("Redis client not provided");
		}
		if (typeof params.redis_client !== 'object') {
			throw new Error("redis_client needs to be a object");
		}
		
		if (params.token_TTL) {
			if (typeof params.token_TTL !== 'number') {
				throw new Error("token_TTL should be a Number");
			}
			token_TTL = params.token_TTL;
		}
		
		if (params.token_bytes_length) {
			if (typeof params.token_bytes_length !== 'number') {
				throw new Error("token_bytes_length should be a Number");
			}
			if (params.token_bytes_length <= 0) {
				throw new Error("token_bytes_length should be positive Number")
			}
			token_bytes_length = params.token_bytes_length;
		}

		client = params.redis_client;

		return service;

	},

	getService: function() {

		if (!client) {
			throw new Error("Need to initialize session first. Call init() method");
		}

		return service;

	},

};

module.exports = initialization;