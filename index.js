var moment = require('moment'),
	crypto = require('crypto'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	client;

// default token life time. Token's duration is prolonged
// after each validation for the value of token_TTL
var token_TTL = 2 * 3600;
// tokens lenght in bytes
var token_bytes_length = 24;
// secondary indexes
var sec_indexes = [];

var service = {

	validate: function(token, cb) {

		return new Promise(function(resolve, reject) {

			client.hgetall(token, function(err, session) {

				if (err) {
					return reject(err);
				}

				if (!session) {

					return reject("Invalid token");

				}

				if (session.user_id) {
					session.user_id = parseInt(session.user_id);
				}

				//
				// Prolong the sessions for token_TTL
				//
				client.expire(token, token_TTL);
				
				//
				//  Prolong secondary indexes for token_TTL
				//
				sec_indexes.forEach(function(elem){
					if (session[elem] || session[elem] === 0 || session[elem] === "") {
						var key = elem + ":" + session[elem];
						client.expire(key, token_TTL);
					}
				});

				return resolve(session);

			});

		}).nodeify(cb);

	},

	create: function(params, cb) {

		return new Promise(function(resolve, reject) {

			if (!params) {
				throw new Error("Invalid params");
			}

			var data = _.clone(params),
				token,
				i = 0,
				limit = 20;

			var generateUniqueToken = function(data) {

				if (i++ >= limit) {
					throw new Error("Can't generate unique token");
				}

				token = crypto.randomBytes(token_bytes_length).toString('hex');

				client.hgetall(token, function(err, session) {

					if (err) {
						return reject(err);
					}

					if (session) {
						//	There is already specified token in DB, generate new one
						return generateUniqueToken(data);
					}

					if (!data.createdAt) {
						data.createdAt = moment().utc().format('YYYY-MM-DD HH:mm:ss');
					}

					client.hmset(token, data, function(){
						//tokens are valid for token_TTL
						client.expire(token, token_TTL);
					});
					
					// add custom idexes
					sec_indexes.forEach(function(elem){
						if (data[elem] || data[elem] === 0 || data[elem] === "") {
							var key = elem + ":" + data[elem];
							client.sadd(key, token, function(){
								client.expire(key, token_TTL);
							});
						}
					});

					data.token = token;
					return resolve(data);

				});
			};

			generateUniqueToken(data);

		}).nodeify(cb);

	},
	
	/**
	 * @method addIndex
	 * @param {String} index Secondary index
	 * @return {String} index
	 */
	
	addIndex: function(index){
		if (typeof index !== "string")
			throw new Error("index should be type of string");
		sec_indexes.push(index);
		return index;
	},
	
	/**
	 * @method removeIndex
	 * @param {String} index Secondary index
	 * @return {String} index
	 */
	
	removeIndex: function(index){
		sec_indexes.pop(index);
		return index;
	}

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