var moment = require('moment');
var crypto = require('crypto');
var client;


var service = {
	
	validate: function(token, cb){
		
		client.hgetall(token, function(err, session){

			if (err){
				return cb(err, null);
			}

			if (session && session.user_id){
				session.user_id = parseInt(session.user_id);
				return cb(null, session);
			}

			return cb("Invalid token", null);

		});
		
	},
	
	create: function(params, cb){

		if (!params){
			throw new Error("Invalid params");
		}
		if (!params.user_id){
			throw new Error("Missing user_id");
		}

		var token = "";
		var i = 0, limit = 20;

		var generateUniqueToken = function(params) {
			
			if(i++ >= limit){
				throw new Error("Can't generate unique token");
			}
			
			token = crypto.randomBytes(24).toString('hex');
			
			var result = client.hgetall(token, function(err, session) {
				if (err) {
					return cb(err);
				}
				if (session) {
					//	There is already specified token in DB, generate new one
					return generateUniqueToken(params);
				}

				var data = {
					user_id: params.user_id,
					sid: params.sid,
					ip: params.ip,
          betaAccess: 1,
					device: params.device,
					createdAt: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
				};

				client.hmset(token, data, function(err, data) {});

				//tokens are valid for 2 hours
				client.expire(token, 2 * 3600);

				// keep track of tokens for some user_id (so called redis custom idexing)
				try {
					client.sadd('user_id:' + params.user_id, JSON.stringify({
						token: token,
						sid: params.sid,
					}));
					client.expire(token, 5 * 3600);
				} catch (e) {}
				
				data.user_id = parseInt(data.user_id);

				data.token = token;
				return cb(null, data);

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