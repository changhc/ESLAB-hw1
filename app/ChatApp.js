import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import MessageItemFromOther from './MessageItemFromOther.js'
import MessageItemFromSystem from './MessageItemFromSystem.js'
import MessageItemFromMe from './MessageItemFromMe.js'

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        chat: [],
        newmsg: "",
        bConnected: false,
        bPressed: false,
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

  clearChat() {
      this.setState({
          chat: [],
          newmsg: "",
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
      this.setState({newmsg: event.target.value});
  }

  handleKeyDown(event) {
      const inputValue = event.target.value;
      const newmsg = this.state.newmsg;
      if (event.keyCode == 13 && inputValue != '') {
          var chat = this.state.chat;
          const newchat = {speaker: '0', message: newmsg};
          chat.push(newchat);
          const sendchat = {speaker: '1', message: newmsg};
          this.chatProxy.send(sendchat);
          event.target.value="";
          this.setState({newmsg: ""});
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
      else {
          return (
                  <MessageItemFromMe
                      message={item.message}
                  />
          );
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
                <input className="new-message"
                       type="text"
                       autoComplete="off"
                       disabled={bDisable}
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

