import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseLine from "@material-ui/core/CssBaseline";
import App from './App';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { store } from './data';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);