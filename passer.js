if (process.env['AIRBRAKE_KEY']) {
  var airbrake = require('airbrake');
  airbrake = airbrake.createClient(process.env['AIRBRAKE_KEY']);
  airbrake.handleExceptions();
}


var Router = require('alice-proxy')
,   Http   = require('http')
;

var router
,   port
,   host
,   alice_host
,   alice_port
;

host = process.env['PASSER_HOST'] || 'localhost';
port = process.argv[2] || process.env['PASSER_PORT'] || '5200';
port = parseInt(port, 10);

alice_host = process.env['ALICE_HOST'] || 'localhost';
alice_port = process.env['ALICE_PORT'] || '5000';
alice_port = parseInt(alice_port, 10);

router = Router.create('passer', function(env){

  var backend
  ;

  backend = env.headers['x-pluto-backend-port'];
  delete env.headers['x-pluto-backend-port'];
  if (!backend) {
    // return 503
    env.respond(503);
    return;
  }

  env.forward(host, parseInt(backend, 10));
});

router.listen(port);
console.log('listening on port '+port);

var _ping = function(){
  var body
  ,   req
  ;

  body = JSON.stringify([{'type': 'passer', 'machine': host, 'port': port}]);

  req = Http.request({
    host: alice_host,
    port: alice_port,
    path: '/api_v1/register.json',
    method: 'POST',
    headers: {
      'Content-Type':   'application/json',
      'Accepts':        'application/json',
      'Content-Length': body.length
    }
  }, function(res){
  });

  req.on('error', function(){
    console.log('Failed to ping!');
  });

  req.write(body);
  req.end();
};

setInterval(_ping, 600000); // every 10 minutes
setTimeout(_ping,   30000);

