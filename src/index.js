import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { cloneDeep } from 'lodash';

class App extends React.Component {
  render() {
    return (
      <p>Hello world.</p>
    );
  }
}

// ========================================

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
