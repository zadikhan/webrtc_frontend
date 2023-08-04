import { Routes, Route } from "react-router-dom";
import "./App.css";
import Hostpage from "./screens/hostpage";
import LobbyScreen from "./screens/Lobby";
import RoomPage from "./screens/Room";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LobbyScreen />} />

        <Route path="/hostpage" element={<Hostpage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  );
}

export default App;
