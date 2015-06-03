var redis = require('redis');
var moment = require('moment');
var client;


var interface = {
	
	validate: function(token, cb){
		
		client.hgetall(token, function(err, session) {

			if (err)
				return cb(err, null);

			if (session && session.user_id) {
				return cb(null, session);
			}

			return cb("Invalid token", null);

		});
		
	},
	
	create: function(params, cb){

		if (!params) {
			throw new Error("Invalid params");
		}
		if (!params.user_id) {
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

				data.token = token;
				return cb(null, data);

			});
		};
		
		generateUniqueToken(params);
		
	},
	
};

var initialization = {

	init: function(redis_credentials) {

		var port, host;
		

		//validation
		if (!redis_credentials) {
			port = 6379;
			host = "127.0.0.1";
		} else {

			if (typeof redis_credentials !== 'object') {
				throw new Error("init parameter needs to be a object");
			}


			if (redis_credentials.port && isNaN(redis_credentials.port)) {
				throw new Error("redis port needs to be number!");
			}
			if (redis_credentials.host && (typeof redis_credentials.host != "string")) {
				throw new Error("redis host needs to be a string!");
			}

			port = redis_credentials.port || 6379;
			host = redis_credentials.host || "127.0.0.1";

		}

		client = new redis.createClient(port, host);

		return interface;
		
		/*
		Testing connection example. problem is that it is async
		//test connection
		var test_value = "some_value", test_key = "test_key";
		client.set(test_key, test_value);
		client.get(test_key, function (err, reply) {
			if(err){
				throw err;
			}
			client.del(test_key);
			//successful connection has been established. return object with methods
    });
		*/
		
	},
	
	interface: interface,

};



module.exports = initialization;