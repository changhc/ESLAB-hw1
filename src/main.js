let peer = null;
let pc = null;
let isConnected = false;
let isWaiting = false;
let disconnectPressed = false;
let connectionTimeout = null;
let queuingTimeout = null;
const socket = io();
const dialogWindow = document.getElementById('dialog-window');
const connectButton = document.getElementById('connectButton');
const MsgType = {
  SELF: '0',
  PEER: '1',
  SYSTEM: '2',
};
const ConvStatus = {
  INIT: '0',
  NEWREQ: '1',
};
const StatusChanged = (statusType) => {
  const msg = {
    type: statusType,
    id: peer.id,
    socketId: socket.id,
  };
  socket.emit('agent', JSON.stringify(msg));
};

const PrintMessage = (msg, type) => {
  const newMsg = document.createElement('div');
  newMsg.classList.add('msg');
  if (type === MsgType.SELF) newMsg.classList.add('myMsg');
  else if (type === MsgType.PEER) newMsg.classList.add('peerMsg');
  else if (type === MsgType.SYSTEM) newMsg.classList.add('sysMsg');
  newMsg.textContent = msg;
  dialogWindow.appendChild(newMsg);
  dialogWindow.scrollTop = dialogWindow.scrollHeight;
};

const AdjustChat = (disable) => {
  const inputArea = document.getElementById('input-area');
  if (disable) {
    inputArea.firstElementChild.setAttribute('contenteditable', 'false');
    inputArea.firstElementChild.style.opacity = 0.5;
    inputArea.style.backgroundColor = '#ccc';
  } else {
    inputArea.firstElementChild.setAttribute('contenteditable', 'true');
    inputArea.firstElementChild.style.opacity = 1.0;
    inputArea.style.backgroundColor = '';
  }
};

const OnPeerConnection = () => {
  isWaiting = false;
  clearTimeout(queuingTimeout);
  while (dialogWindow.firstChild) dialogWindow.removeChild(dialogWindow.firstChild);
  const element = document.getElementById('real-input-area');
  element.textContent = '';
  element.nextElementSibling.style.visibility = 'visible';
  PrintMessage(`Connected to ${pc.peer}. Say hi!`, MsgType.SYSTEM);
  connectButton.innerText = 'Disconnect';
  connectButton.disabled = false;
  AdjustChat(false);
  pc.on('open', () => {
    console.log('conn opened');
    isConnected = true;
  });
  pc.on('data', (data) => {
    PrintMessage(data, MsgType.PEER);
  });
  pc.on('close', () => {
    console.log('conn closed');
    clearTimeout(connectionTimeout);
    connectButton.innerText = 'Find a new peer';
    if (disconnectPressed) {
      PrintMessage('You have left this conversation.', MsgType.SYSTEM);
      disconnectPressed = false;
    } else {
      PrintMessage(`${pc.peer} has left this conversation.`, MsgType.SYSTEM);
    }
    AdjustChat(true);
    isConnected = false;
  });

  connectionTimeout = setTimeout(() => {
    if (!isConnected) {
      PrintMessage('No reply. Finding a new peer for you...', MsgType.SYSTEM);
      StatusChanged(ConvStatus.NEWREQ);
    }
  }, 10000);
};

socket.on('OK', (msg) => {
  console.log(`Socket: ${msg}`);
});

socket.on('new peer', (msg) => {
  if (msg !== peer.id) {
    pc = peer.connect(msg);
    OnPeerConnection();
  } else {
    StatusChanged('1');
  }
});

socket.on('connect', () => {
  document.getElementById('socketId').innerText = socket.id;
  peer = new Peer({ host: 'localhost', port: 9000, path: '/myapp' });
  peer.on('open', () => {
    document.getElementById('id').innerText = peer.id;
    StatusChanged(ConvStatus.INIT);
    connectButton.innerText = 'Waiting...';
    connectButton.disabled = true;
    isWaiting = true;
    AdjustChat(true);
    PrintMessage('Welcome! Finding a peer for you...', MsgType.SYSTEM);
    queuingTimeout = setTimeout(() => {
      if (isWaiting) {
        PrintMessage('Sorry, it takes longer time than expected.\r\nWe\'re still working on it...', MsgType.SYSTEM);
      }
    }, 30000);
  });

  peer.on('connection', (conn) => {
    pc = conn;
    OnPeerConnection();
  });

  peer.on('error', (err) => {
    console.log(err);
  });

  peer.on('disconnected', () => {
    PrintMessage('Disconnected from server', MsgType.SYSTEM);
    AdjustChat(true);
  });
});

connectButton.addEventListener('click', () => {
  if (!pc || !pc.open) {
    StatusChanged(ConvStatus.NEWREQ);
    connectButton.innerText = 'Waiting...';
    connectButton.disabled = true;
    isWaiting = true;
    queuingTimeout = setTimeout(() => {
      if (isWaiting) {
        PrintMessage('Sorry, it takes longer time than expected.<br>We\'re still working on it...', MsgType.SYSTEM);
      }
    }, 30000);
    AdjustChat(true);
  } else if (pc.open) {
    disconnectPressed = true;
    pc.close();
  }
});

/* input area start */
document.getElementById('real-input-area').addEventListener('keydown', (event) => {
  if (event.keyCode === 13 && !event.shiftKey) {  // Enter key pressed
    event.preventDefault();
    const element = event.target;
    if (element.textContent.length > 0) {
      PrintMessage(element.textContent, MsgType.SELF);
      pc.send(element.textContent);
      element.textContent = '';
      element.nextElementSibling.style.visibility = 'visible';
    }
  }
});

document.getElementById('real-input-area').addEventListener('input', (event) => {
  const element = event.target.nextElementSibling;
  if (event.target.innerText.length !== 0) {
    element.style.visibility = 'hidden';
  } else {
    element.style.visibility = 'visible';
  }
});
/* input area end */
