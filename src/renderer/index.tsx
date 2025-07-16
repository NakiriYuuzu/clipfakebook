import React from 'react';
import ReactDOM from 'react-dom/client';
import UIManagerSimple from './UIManagerSimple';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <UIManagerSimple />
  </React.StrictMode>
);