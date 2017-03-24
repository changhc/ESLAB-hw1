import React from 'react';

export default class MessageItemFromSystem extends React.Component {
    render() {
        return (
            <div className="message-from-system">
                <span>{this.props.message}</span>
            </div>
        );
    }
}
