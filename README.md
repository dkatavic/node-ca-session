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
var ca_session = require('ca-session-service');

var SessionService = ca_session.init({
    redis_client: new redis.createClient(PORT,HOST)
});
```

You can override token's Time To Live and bytes lenght

```node
var SessionService = ca_session.init({
    redis_client: new redis.createClient(PORT,HOST),
    token_TTL: 2 * 3600, // TTL in seconds, defaults to 2h
    token_bytes_length: 24 // Tokens bytes lenght, defaults to 24 bytes
});
```

### create session

```node
SessionService.create({user_id: 150, foo: 'bar'}, 
    function(err, session){
        console.log(session);
        //{token: "GENERATED_TOKEN_VALUE", user_id: 150, foo: "bar", createdAt: "2015-10-25 20:14:10"}
    });
```

### validate session

```node
SessionService.validate(TOKEN, 
    function(err, session){
        console.log(session);
        //{user_id: 150, foo: "bar", createdAt: "2015-10-25 20:14:10"}
    });
```

### Promises
All methods support promise and callback pattern

### validate session using promise

```node
SessionService.validate(TOKEN)
.then(function(session){
    console.log(session);
    //{user_id: 150, foo: "bar", createdAt: "2015-10-25 20:14:10"}
})
.catch(function(err){
    console.log(err);
});
```

# Test

* Make sure you have redis DB running on default port and host

```bash
npm test
```