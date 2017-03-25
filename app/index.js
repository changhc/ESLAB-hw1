import React from 'react';
import ReactDOM from 'react-dom';

import './main.css'

import App from './ChatApp.js';
import ChatProxy from './ChatProxy.js';

var proxy = new ChatProxy();

ReactDOM.render(<App chatProxy={proxy} />, document.getElementById('app'));
