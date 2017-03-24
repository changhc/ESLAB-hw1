import React from 'react';

export default class MessageItemFromMe extends React.Component {
    render() {
        return (
            <div className="message-from-me">
                <span>{this.props.message}</span>
            </div>
        );
    }
}
