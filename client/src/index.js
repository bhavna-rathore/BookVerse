import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ContextProvider } from './context/Context';
import "./index.css";

//Mounting the react app in to html element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendering the app
root.render(
  <React.StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>

  </React.StrictMode>
);


