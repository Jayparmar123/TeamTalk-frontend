import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
