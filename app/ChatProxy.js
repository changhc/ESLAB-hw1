import util from 'util';
import events from 'events';

const MsgType = {
    SELF: '0',
    PEER: '1',
    SYSTEM: '2',
};

const ConvStatus = {
    INIT: '0',
    NEWREQ: '1',
};

var ChatProxy = function () {
    events.EventEmitter.call(this);
    this.peer = null;
    this.pc = null;
    this.isConnected = false;
    this.isWaiting = false;
    this.disconnectPressed = false;
    this.connectionTimeout = null;
    this.queuingTimeout = null;
}

ChatProxy.prototype = Object.create(events.EventEmitter.prototype);

ChatProxy.prototype.StatusChanged = function (statusType) {
    const msg = {
        type: statusType,
        id: this.peer.id,
        socketId: this.socket.id,
    };
    this.socket.emit('agent', JSON.stringify(msg));
};

ChatProxy.prototype.OnPeerConnection = function () {
    var self = this;
    this.isWaiting = false;
    clearTimeout(this.queuingTimeout);
    this.emit('clear-chat');
    this.emit('message', {
        speaker: '2',
        message: 'Connected to ' + this.pc.peer + '. Say hi!',
    });

    self.pc.on('open', () => {
        console.log('conn opened');
        self.isConnected = true;
        self.emit('status-change');
    });

    self.pc.on('data', (data) => {
        self.emit('message', data);
    });

    self.pc.on('close', () => {
        console.log('conn closed');
        clearTimeout(self.connectionTimeout);
        if (self.disconnectPressed) {
            self.emit('message', {
                speaker: '2',
                message: 'You have left this conversation.',
            });
            self.emit('status-change');
        }
        else {
            self.emit('message', {
                speaker: '2',
                message: self.pc.peer + ' have left this conversation.',
            });
            this.disconnectPressed = true;
            self.emit('status-change');
        }
        self.isConnected = false;
        self.emit('status-change');
    });

    this.connectionTimeout = setTimeout(() => {
        if (!self.isConnected) {
            self.emit('message', {
                speaker: '2',
                message: 'No reply, Finding a new peer for you...',
            });
            self.StatusChanged(ConvStatus.NEWREQ);
        }
    }, 10000);
};

ChatProxy.prototype.connect = function () {
    var self = this;
    this.socket = io();

    this.socket.on('OK', (msg) => {
        console.log(`Socket: ${msg}`);
    });

    this.socket.on('new peer', (msg) => {
        if (msg !== self.peer.id) {
            self.pc = self.peer.connect(msg);
            self.OnPeerConnection();
        }
        else {
            self.StatusChanged(ConvStatus.NEWREQ);
        }
    });

    this.socket.on('connect', () => {
        self.peer = new Peer({ host: 'localhost', port: 9000, path: '/myapp' });
        self.peer.on('open', () => {
            self.StatusChanged(ConvStatus.INIT);
            self.isWaiting = true;
            self.emit('clear-chat');
            self.emit('message', {
                speaker: '2',
                message: 'Welcome! Finding a peer for you...',
            });
            self.queuingTimeout = setTimeout(() => {
                if (self.isWaiting) {
                    self.emit('message', {
                        speaker: '2',
                        message: 'Sorry, it takes longer time than expected.\r\nWe\'re still working on it...',
                    });
                }
            }, 30000);
        });

        self.peer.on('connection', (conn) => {
            self.pc = conn;
            self.OnPeerConnection();
            console.log('OnPeerConnection');
        });

        self.peer.on('error', (err) => {
            console.log(err);
        });

        self.peer.on('disconnected', () => {
            self.emit('message', {
                speaker: '2',
                message: 'Disconnected from server',
            });
            self.pc.close();
            self.emit('status-change');
        });
    });
};

ChatProxy.prototype.onNewMessage = function (cb) {
    this.addListener('message', cb);
};

ChatProxy.prototype.onClearChat = function (cb) {
    this.addListener('clear-chat', cb);
};

ChatProxy.prototype.onConnectionChange = function (cb) {
    this.addListener('status-change', cb);
};

ChatProxy.prototype.send = function (msg) {
    this.pc.send(msg);
};

ChatProxy.prototype.disconnectToggle = function () {
    this.disconnectPressed = (this.disconnectPressed) ? false : true;
    if (this.disconnectPressed) {
        this.pc.close();
    }
    else {
        this.StatusChanged(ConvStatus.NEWREQ);
    }
    this.emit('status-change');
};

ChatProxy.prototype.getConnectStatus = function () {
    return this.isConnected;
};

ChatProxy.prototype.getConnectPressed = function () {
    return this.disconnectPressed;
};

export default ChatProxy;

