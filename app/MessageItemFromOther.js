import React from 'react';

export default class MessageItemFromOther extends React.Component {
    render() {
        return (
            <div className="message-from-other">
                <span>{this.props.message}</span>
            </div>
        );
    }
}
