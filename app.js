'use strict';
// Module Dependencies
// -------------------
var express     = require('express');
var http        = require('http');
var JWT         = require('./lib/jwtDecoder');
var path        = require('path');
var request     = require('request');
var routes      = require('./routes');
var activityCreate   = require('./routes/activityCreate');
var activityUpdate   = require('./routes/activityUpdate');
var activityUtils    = require('./routes/activityUtils');
var pkgjson = require( './package.json' );

var app = express();

// Register configs for the environments where the app functions
// , these can be stored in a separate file using a module like config


var APIKeys = {
    appId           : '19f61f0f-260d-4f1b-b1e7-0d93a54e1600',
    clientId        : '381oumcqyzoiyix0l5f0jlo5',
    clientSecret    : 'NYUZT1Lp9BOscEj6BERVhliV',
    appSignature    : '0zy4pe503z5x1pped1onydptolqlrtkiazwdbxzdaptpf54sq1ufyak4zkjtp2o5ehrijzztfyru04oud2mrehzcftnupgec1ewqgmgabzy4mzq0bzlwl0gqnrx5amgxuicgrfpo3jxxapug3mb2iv4dre0fd33nimqjjqcxtu1jfqnhom2ivq2nzdpajtliu4qoc3aa3qkpwdyp2vhzwi00hovybhwug0bpwxbvnjrvllcph5uqsxrsuszyi4e',
    authUrl         : 'https://auth.exacttargetapis.com/v1/requestToken?legacy=1'
};


// Simple custom middleware
function tokenFromJWT( req, res, next ) {
    // Setup the signature for decoding the JWT
    var jwt = new JWT({appSignature: APIKeys.appSignature});
    
    // Object representing the data in the JWT
    var jwtData = jwt.decode( req );

    // Bolt the data we need to make this call onto the session.
    // Since the UI for this app is only used as a management console,
    // we can get away with this. Otherwise, you should use a
    // persistent storage system and manage tokens properly with
    // node-fuel
    req.session.token = jwtData.token;
    next();
}

// Use the cookie-based session  middleware
app.use(express.cookieParser());

// TODO: MaxAge for cookie based on token exp?
app.use(express.cookieSession({secret: "DeskAPI-CookieSecret0980q8w0r8we09r8"}));

// Configure Express
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.favicon());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Express in Development Mode
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// HubExchange Routes
app.get('/', routes.index );
app.post('/login', tokenFromJWT, routes.login );
app.post('/logout', routes.logout );

// Custom Activity Routes for interacting with Desk.com API
app.post('/ixn/activities/create-case/save/', activityCreate.save );
app.post('/ixn/activities/create-case/validate/', activityCreate.validate );
app.post('/ixn/activities/create-case/publish/', activityCreate.publish );
app.post('/ixn/activities/create-case/execute/', activityCreate.execute );

app.post('/ixn/activities/update-case/save/', activityUpdate.save );
app.post('/ixn/activities/update-case/validate/', activityUpdate.validate );
app.post('/ixn/activities/update-case/publish/', activityUpdate.publish );
app.post('/ixn/activities/update-case/execute/', activityUpdate.execute );

app.get('/clearList', function( req, res ) {
    // The client makes this request to get the data
    activityUtils.logExecuteData = [];
    res.send( 200 );
});


// Used to populate events which have reached the activity in the interaction we created
app.get('/getActivityData', function( req, res ) {
    // The client makes this request to get the data
    if( !activityUtils.logExecuteData.length ) {
        res.send( 200, {data: null} );
    } else {
        res.send( 200, {data: activityUtils.logExecuteData} );
    }
});

app.get( '/version', function( req, res ) {
    res.setHeader( 'content-type', 'application/json' );
    res.send(200, JSON.stringify( {
        version: pkgjson.version
    } ) );
} );

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});