let peer = null;
let pc = null;
let isConnected = false;
let isWaiting = false;
let disconnectPressed = false;
let connectionTimeout = null;
let queuingTimeout = null;
let msgCount = 0;
const socket = io();
const dialogWindow = document.getElementById('dialog-window');
const connectButton = document.getElementById('connectButton');

/* enum definition start */
const MsgType = {
  SELF: '0',
  PEER: '1',
  SYSTEM: '2',
};

const ConvStatus = {
  INIT: '0',
  NEWREQ: '1',
};
/* enum definition end */

/* function definition start */
const ClearWindow = () => {
  while (dialogWindow.firstChild) dialogWindow.removeChild(dialogWindow.firstChild);
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
  newMsg.setAttribute('time', Date.now());
  if (type === MsgType.SYSTEM) newMsg.classList.add('sysMsg');
  else {
    msgCount += 1;
    if (type === MsgType.PEER) newMsg.classList.add('peerMsg');
    else newMsg.classList.add('myMsg');
  }
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

const SaveMessage = () => {
  const msgList = document.querySelectorAll('div.msg:not(.sysMsg)');
  let text = `Peer ID: ${pc.peer}\n`;
  for (let i = 0; i < msgList.length; i += 1) {
    const date = new Date(parseInt(msgList[i].getAttribute('time'), 10)).toLocaleString();
    text += `${date}\t`;
    if (msgList[i].classList.contains('myMsg')) {
      text += `You\t: ${msgList[i].textContent}\n`;
    } else {
      text += `Peer\t: ${msgList[i].textContent}\n`;
    }
  }
  const date = new Date(Date.now());
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  element.setAttribute('download', `Log-${date.toDateString()} ${date.toLocaleTimeString()}.txt`);

  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const SaveLogButton = () => {
  const newMsg = document.createElement('button');
  newMsg.classList.add('msg');
  newMsg.textContent = 'Download your log';
  newMsg.onclick = SaveMessage;
  dialogWindow.appendChild(newMsg);
  dialogWindow.scrollTop = dialogWindow.scrollHeight;
};

const OnPeerConnection = () => {
  isWaiting = false;
  clearTimeout(queuingTimeout);
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

    if (msgCount > 0) {
      SaveLogButton();
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
/* function definition end */

/* socket event registration start */
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
    ClearWindow();
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
/* socket event registration end */

/* DOM event listener registration start */
connectButton.addEventListener('click', () => {
  if (!pc || !pc.open) {
    StatusChanged(ConvStatus.NEWREQ);
    ClearWindow();
    const element = document.getElementById('real-input-area');
    element.textContent = '';
    element.nextElementSibling.style.visibility = 'visible';
    PrintMessage('Finding a new peer...', MsgType.SYSTEM);
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
/* DOM event listener registration end */

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
