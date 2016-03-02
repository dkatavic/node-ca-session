var assert = require('assert'),
	redis = require('redis'),
	redis_client = new redis.createClient(),
	session_service = require('./../index');

var user_id = Math.floor(Math.random() * (10000 - 1)) + 1;
var token;

suite('initialization', function () {//because of invalid token_TTL
 test('should initialize service instance', function (done) {
   assert.equal('object', typeof session_service.init({redis_client: redis_client}));
   // must call done() so that mocha know that we are... done.
   // Useful for async tests.
   done();
 });
});

suite('session service', function(){
	test('should create session', function(done){
		session_service.getService().create({user_id: user_id}, function(err, data){
			assert.equal("string", typeof  data.token);
			token = data.token;
			done();
		});
	});
	test('should create session using promise', function(done){
		session_service.getService().create({user_id: user_id}).then(function(data){
			assert.equal("string", typeof  data.token);
			done();
		});
	});
	test('should validate session', function(done){
		session_service.getService().validate(token, function(err, data){
			assert.equal(user_id,  data.user_id);
			done();
		});
	});
	test('should validate session using promise', function(done){
		session_service.getService().validate(token).then(function(data){
			assert.equal(user_id,  data.user_id);
			done();
		});
	});
	test('should create secondary index user_id', function(done){
		session_service.getService().addIndex("user_id");
		done();
	});
	test('should remove secondary index user_id', function(done){
		session_service.getService().removeIndex("user_id");
		done();
	});
	test('should use secondary index user_id', function(done){
		session_service.getService().addIndex("user_id");
		var user_id = Math.floor(Math.random() * (100000 - 1)) + 1,
			token;
			
		session_service.getService().create({user_id: user_id})
		.then(function(data){
			token = data.token;
			// secondary index key
			var key = "user_id:" + user_id; 
			redis_client.smembers(key, function(err, members){
				if (err)
					return done(err);
				// members array should contain token
				for (var i = 0; i < members.length; i++) {
					if (members[i] == token)
						return done();
				}
				done(new Error("user_id secondary index hasn't been used"));
			});
		}).catch(done);
	});
});