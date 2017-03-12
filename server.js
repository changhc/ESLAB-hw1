const restify = require('restify');
const socketio = require('socket.io');
const path = require('path');
const redis = require('redis').createClient();

const queue = [];
const pair = [];

redis.on('error', (err) => {
  console.log(`Redis:\t${err}`);
});

const PeerServer = require('peer').PeerServer({ port: 9000, path: '/myapp' });

PeerServer.on('connection', (id) => {
  console.log(`Peer:\tUser ${id} is now connected.`);
});

PeerServer.on('disconnect', (id) => {
  console.log(`Peer:\tUser ${id} is disconnected.`);
  redis.hdel(id, 'socketId');
  redis.hdel(id, 'status');
});

const server = restify.createServer();
const io = socketio.listen(server.server);
io.sockets.on('connection', (socket) => {
  console.log(`Socket:\tNew connection: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket:\tUser ${socket.id} has disconnected.`);
  });

  socket.on('agent', (msg) => {
    ((data) => {
      const jsonData = JSON.parse(data);
      console.log(`Peer:\tEvent type ${jsonData.type} from user ${jsonData.id}`);
      switch (jsonData.type) {
        case '0':     // new agent
          redis.hset(jsonData.id, 'socketId', jsonData.socketId);
          redis.hset(jsonData.id, 'status', 'waiting');
          queue.push({ id: jsonData.id, socketId: jsonData.socketId });
          socket.emit('OK', 'welcome!');
          break;
        case '1':     // "abandoned" peer disconnected and ready for a new peer.
          redis.hset(jsonData.id, 'status', 'waiting');
          queue.push({ id: jsonData.id, socketId: jsonData.socketId });
          socket.emit('OK', 'in queue');
          break;
        default:
          console.log('Redis:\tgg');
      }
    })(msg);
  });

  socket.on('my other event', (data) => {
    console.log(data);
  });
});

setInterval(() => {
  // console.dir(io);
  const currentQueue = queue;
  console.log(`Peer:\tPairLength: ${pair.length}, QueueLength: ${currentQueue.length}`);
  if (pair.length === 1) {
    if (!io.sockets.connected[pair[0].socketObj.id]) {
      pair.length = 0;
      console.log('Peer:\tOrphan in the pair');
    }
  }
  while (pair.length < 2 && currentQueue.length > 0) {
    const user = currentQueue.shift();
    const socket = io.sockets.connected[user.socketId];
    if (socket) pair.push({ id: user.id, socketObj: socket });
  }
  if (pair.length === 2) {
    pair[0].socketObj.emit('new peer', pair[1].id);
    // pair[1].socketObj.emit('new peer', pair[0].id);
    redis.hset(pair[0].id, 'status', 'paired');
    redis.hset(pair[1].id, 'status', 'paired');
    pair.length = 0;
  }
}, 5000);

server.use(restify.bodyParser());
server.listen(3000, () => {
  console.log('%s listening to %s', server.name, server.url);
});

server.get(/\/*/, restify.serveStatic({
  directory: path.join(__dirname, '/src'),
  default: 'main.html',
}));
