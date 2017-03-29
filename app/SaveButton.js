import React from 'react';

export default class SaveButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      content: props.content,
      filename: props.filename,
    };
  }
  saveLog() {
    var link = document.createElement('a');
    link.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(this.state.content)}`);
    link.setAttribute('download', `Log-${this.state.filename}.txt`);

    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }

  render() {
    return (
      <button className="message-from-system" onClick={this.saveLog.bind(this)}>Download your log</button>
    );
  }
}