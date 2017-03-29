import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import MessageItemFromOther from './MessageItemFromOther.js'
import MessageItemFromSystem from './MessageItemFromSystem.js'
import MessageItemFromMe from './MessageItemFromMe.js'
import SaveButton from './SaveButton.js'

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        chat: [],
        newmsg: "",
        bConnected: false,
        bPressed: false,
        peerId: '',
    };
  }

  resetState() {
      this.setState({
          chat: [],
          newmsg: "",
          bConnected: false,
      });
  }

  scrollToBottom() {
          const node = ReactDOM.findDOMNode(this.messagesEnd);
          node.scrollIntoView({behavior: "smooth"});
  }

  componentDidMount() {
          this.scrollToBottom();
          this.chatProxy = this.props.chatProxy;
          this.chatProxy.connect();
          this.chatProxy.onNewMessage(this.addNewMessage.bind(this));
          this.chatProxy.onClearChat(this.clearChat.bind(this));
          this.chatProxy.onConnectionChange(this.updateStatus.bind(this));
  }

  componentDidUpdate() {
          this.scrollToBottom();
  }

  clearChat(peer) {
      this.setState({
          chat: [],
          newmsg: '',
          peerId: peer,
      })
  }

  updateStatus() {
      this.setState({bConnected: this.chatProxy.getConnectStatus()});
      this.setState({bPressed: this.chatProxy.getConnectPressed()});
      console.log('Status changed.');
  }

  addNewMessage(msg) {
      const chat = this.state.chat;
      chat.push(msg);
      this.setState({chat: chat});
  }

  handleInputMessage(event) {

  }

  handleKeyDown(event) {
      const inputValue = event.target.textContent;
      const time = Date.now();
      if (event.keyCode === 13 && inputValue !== '') {
          event.preventDefault();
          var chat = this.state.chat;
          this.setState({ newmsg: inputValue });
          const newmsg = this.state.newmsg;
          console.log(newmsg);
          const newchat = {speaker: '0', message: inputValue, sentTime: time};
          chat.push(newchat);
          const sendchat = {speaker: '1', message: inputValue, sentTime: time};
          this.chatProxy.send(sendchat);
          event.target.textContent = '';
          this.setState({newmsg: ''});
      }
      else
      {
          this.handleInputMessage;
      }
  }

  renderMessageItem(item) {
      if (item.speaker === '1') {
          return (
                  <MessageItemFromOther
                      message={item.message}
                  />
          );
      }
      else if (item.speaker === '2') {
          return (
                  <MessageItemFromSystem
                      message={item.message}
                  />
          );
      }
      else if (item.speaker === '0') {
          return (
                  <MessageItemFromMe
                      message={item.message}
                  />
          );
      }
      else {
          let text = '';
          for (let i = 0; i < this.state.chat.length; i += 1) {
              if (this.state.chat[i].speaker === '0' || this.state.chat[i].speaker === '1') {
                text += `${new Date(this.state.chat[i].sentTime).toLocaleString()}\t`;
              }
              if (this.state.chat[i].speaker === '0') {
                text += `You\t: ${this.state.chat[i].message}\n`;
              } else if (this.state.chat[i].speaker === '1') {
                text += `Peer: ${this.state.chat[i].message}\n`;
              }
          }
          if ( text !== '') {
            return (
                <SaveButton
                    filename = {new Date(Date.now()).toLocaleString()}
                    content = {`Peer ID: ${this.state.peerId}\n${text}--- End of conversation ---\n`}
                />
            );
          }
      }
  }

  clickButton(event) {
      this.chatProxy.disconnectToggle();
  }

  render() {
    const {chat, newmsg, bConnected, bPressed} = this.state;
    const chatProxy = this.chatProxy;
    let bDisable = bConnected ? false : true,
        buttonDisable = false,
        buttonText = '';

    if (!bPressed && !bConnected) {
        buttonText = 'Pending';
        buttonDisable = true;
    }
    else if (!bPressed && bConnected) {
        buttonText = 'Disconnect';
    }
    else if (bPressed && bConnected) {
        buttonText = 'Connect';
    }
    else {
        buttonText = 'Connect';
    }


    return (
      <div className="container">
            <div className="heading">
                <h3 className="text-center">Messenger</h3>
            </div>
            <div className="message-list">
                {chat.map(this.renderMessageItem, this)}
                <div style={ {float:"left", clear: "both"} }
                    ref={(el) => { this.messagesEnd = el; }}></div>
            </div>
            <div className="footer">
                <div className="new-message"
                    contentEditable={!bDisable}
                       autoComplete="off"
                       placeholder="Enter your message here..."
                       onChange={this.handleInputMessage.bind(this)}
                       onKeyDown={this.handleKeyDown.bind(this)}
                   />
                <button onClick={this.clickButton.bind(this)}
                        disabled={buttonDisable}>{buttonText}</button>
            </div>
      </div>
    );
  }
}

