[![Build Status](https://travis-ci.org/dkatavic/node-ca-session.svg)](https://travis-ci.org/dkatavic/node-ca-session)
# node-ca-session
Module for session handling. This module generates unique token for specified data and stores it in Redis DB. Session data
can be validated using validate method. With each validation tokens duration is prolonged for specified TTL.

Supports TTL (Time To Live)

# Install

```sh
npm install ca-session-service
```

# Usage

### initialization

```node
var redis = require('redis');
var CaSession = require('ca-session-service');

var sessionService = CaSession.init({
    redis_client: new redis.createClient(PORT,HOST)
});
```

"ca-session-service" depends on npm package "redis" (v ^2.4.2). Redis isn't hard dependecy so that user can be more flexible in configuring and authenticating with Redis server.

You can override token's Time To Live and bytes lenght

```node
var sessionService = CaSession.init({
    redis_client: new redis.createClient(PORT,HOST),
    token_TTL: 2 * 3600, // TTL in seconds, defaults to 2h
    token_bytes_length: 24 // Tokens bytes lenght, defaults to 24 bytes
});
```

### create session

```node
sessionService.create({user_id: 150, foo: 'bar'}, 
    function(err, session){
        console.log(session);
        //{token: "GENERATED_TOKEN_VALUE", user_id: 150, foo: "bar", createdAt: "2015-10-25 20:14:10"}
    });
```

### validate session

```node
sessionService.validate(TOKEN, 
    function(err, session){
        console.log(session);
        //{user_id: 150, foo: "bar", createdAt: "2015-10-25 20:14:10"}
    });
```

### Promises
All methods support promise and callback pattern

### validate session using promise

```node
sessionService.validate(TOKEN)
.then(function(session){
    console.log(session);
    //{user_id: 150, foo: "bar", createdAt: "2015-10-25 20:14:10"}
})
.catch(function(err){
    console.log(err);
});
```

### Secondary indexes

ca-session-service supports secondary indexes. If custom index is set, when session is created, extra new key is created, where key is equal to `"{$index_property}:{$index_value}"`. Every token that belongs to specified index is added as member to set stored at key. For example, if you 
create session with data `{user_id: 150}` and property user_id is secondary index, after creating session, ca-session-service will add token as member of key `"user_id:150"`.
This can be used for keeping track of all active user's token's, and deleting them upon closing account.

```node
sessionService.addIndex('user_id');
sessionService.create({user_id: 150, foo: 'bar'}, 
    function(err, session){
        console.log(session);
        //{token: "SOME_RANDOM_TOKEN", user_id: 150, foo: "bar", createdAt: "2015-10-25 20:14:10"}
        
        // as defined in custom indexes, "user_id:150" key now contains all associated tokens
        redis_client.smembers("user_id:150", function(err, members){
        
            // members contain all tokens
            console.log(members);
            // ["SOME_RANDOM_TOKEN"]
            
            // now you can delete all tokens from redis db associated with user
            members.forEach(function(token){
                redis_client.del(token);
            });
            
        });
        
    });
```


# Test

* Make sure you have redis DB running on default port and host

```bash
npm test
```