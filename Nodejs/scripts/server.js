const http = require('http');
const { updatePresence } = require('./discordPresence');

let rateTimer = false;
const rateDuration = 15000; // Voi laittaa pienemmäksi ehkä mutta discordi sitten hoitaa sen rate limitin. Jos pistät liian alhaseksi niin tulee varmaan 403 erroreita
let rateStartTime;

let heartBeatId;

function createHttpServer(excludedArray, familiarArray, preferences, RPC, logger) {
    const server = http.createServer((req, res) => {
        // Tuo "ok" jos serveri on käynnissä
        if (req.method === 'GET' && req.url === '/mangapresence/status') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('OK');
        
        // Sammuttaa serverin kun 3 min kulunt ilman viestejä
        } else if (req.method === 'GET' && req.url === '/mangapresence/heartbeat') {
          clearTimeout(heartBeatId);
          heartBeatId = setTimeout(() => {
            console.log("Server closing due to inactivity.");
            server.close(() => {
              const fileName = __filename;
              logger.info({ fileName }, 'Server was closed due to inactivity.');
              throw new Error('Server closed due to inactivity');
            });
          }, 3 * (60 * 1000));
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Ok');

        // Discord presence päivitys
        } else if (req.method === 'POST' && req.url === '/mangapresence/pageData') {
          let data = '';
        
          req.on('data', (chunk) => {
            data = chunk;
          });
      
          req.on('end', () => {
            if (!rateTimer) {
                rateTimer = true;
                const parsedData = JSON.parse(data);
                updatePresence(RPC, parsedData, logger, preferences);
                
                setTimeout(() => {
                  rateTimer = false;
                }, rateDuration)
              
                rateStartTime = Date.now();
              
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Presence päivitetty');
            } else {
                console.log("Time left until you can update:", (Math.floor(rateDuration - (Date.now() - rateStartTime)) / 1000));
                res.statusCode = 429;
                const timeLeft = Math.floor(rateDuration - (Date.now() - rateStartTime)) / 1000;
                res.end(`Too many requests. Wait: ${timeLeft} seconds.`);
            }
          });
        // Lähettää filtteri arrayt
        } else if (req.method === 'POST' && req.url === '/mangapresence/filterArrays') {
            const response = {
              Familiar: familiarArray,
              Excluded: excludedArray
            };
        
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(response));
        } else {
            res.statusCode = 404;
            res.end('Not found');
        }
      });
    const port = 56324;
    server.listen(port, 'localhost', () => {
        console.log(`Server running at http://localhost:${port}/`);
    });
}

module.exports = {createHttpServer};