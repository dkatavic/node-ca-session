var assert = require('assert');
var redis = require('redis');
var index = require('./../index');

var user_id = Math.floor(Math.random() * (10000 - 1)) + 1;
var token;

suite('initialization', function () {
 test('should initialize correctly', function (done) {
   assert.equal('object', typeof index.init({redis_client: new redis.createClient()}));
   // must call done() so that mocha know that we are... done.
   // Useful for async tests.
   done();
 });
});

suite('session service', function(){
	test('should create session', function(done){
		index.getService().create({user_id: user_id}, function(err, data){
			assert.equal("string", typeof  data.token);
			token = data.token;
			done();
		});
	});
	test('should validate session', function(done){
		index.getService().validate(token, function(err, data){
			assert.equal(user_id,  data.user_id);
			done();
		});
	});
});