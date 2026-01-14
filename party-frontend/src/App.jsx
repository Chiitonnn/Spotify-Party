import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useUser } from './hooks/useUser';
import Header from './components/Header';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import Room from './pages/Room';
import Callback from './pages/Callback';

function App() {
  const { user, saveUser, clearUser } = useUser();

  return (
    <BrowserRouter>
      <div style={styles.app}>
        <Header user={user} onLogout={clearUser} />
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/create-room" element={<CreateRoom user={user} />} />
          <Route path="/room/:code" element={<Room user={user} />} />
          <Route path="/callback" element={<Callback onUserLoaded={saveUser} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  }
};

export default App;