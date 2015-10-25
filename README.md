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