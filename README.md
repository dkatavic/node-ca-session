# node-ca-session
Module for CA session handling.

#Install

```sh
npm install ca-session-service
```

#Usage

###initialization

```node
var redis = require('redis');
var ca_session = require('ca-session-service');

//SessionService name is for compability
var SessionService = ca_session.init({
redis_client: new redis.createClient(PORT,HOST)
});
```

###create session

```node
SessionService.create({user_id: 150}, 
    function(err, result){
        console.log(result);
    });
```

###validate session

```node
SessionService.validate(TOKEN, 
    function(err, result){
        console.log(result);
    });
```

#Test

*Make sure you have redis DB running on default port and host

```bash
npm test
```

#For Bobo
to make it compatible with older version, replace SessionService.js with

```node
var redis = require('redis');
var ca_session_service = require('ca-session-service');

module.exports = ca_session_service.init({
	redis_client: new redis.createClient(sails.config.redis.port,sails.config.redis.host)
});
```

and remove initialization of previus session service in bootstrap.js

