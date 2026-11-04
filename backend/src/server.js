const server = require('../../server/src/server');

if (require.main === module) {
  server.startServer().catch((error) => {
    console.error('Server failed to start:', error.message);
    process.exitCode = 1;
  });
}

module.exports = server;
