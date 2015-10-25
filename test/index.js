var assert = require('assert');
var redis = require('redis');
var session_service = require('./../index');

var user_id = Math.floor(Math.random() * (10000 - 1)) + 1;
var token;

suite('initialization', function () {//because of invalid token_TTL
 test('should initialize service instance', function (done) {
   assert.equal('object', typeof session_service.init({redis_client: new redis.createClient()}));
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
	test('should validate session', function(done){
		session_service.getService().validate(token, function(err, data){
			assert.equal(user_id,  data.user_id);
			done();
		});
	});
});