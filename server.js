// server.js - Country Explorer Node.js Server
const http = require('http');
const { handleRequest } = require('./controller');

// Create server with handleRequest from controller.js as the callback
const server = http.createServer(handleRequest);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
