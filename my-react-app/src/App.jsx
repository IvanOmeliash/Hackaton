import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginScreen from "./components/LoginScreen";
import UploadScreen from "./components/UploadScreen";
import FlightDashboard from "./pages/FlightDashboard";
import AccountPage from "./pages/AccountPage";
import "./App.css";

// screens: "upload" | "dashboard" | "account"
export default function App() {
  const { token, login, logout } = useAuth();
  const [screen, setScreen]       = useState("upload");
  const [fileName, setFileName]   = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  if (!token) {
    return <LoginScreen onLogin={login} />;
  }

  if (screen === "account") {
    return (
      <AccountPage
        onBack={() => setScreen("upload")}
        onLogout={() => { logout(); setScreen("upload"); }}
        // Called after GET /my-logs/:id succeeds
        onOpenDashboard={(name, response) => {
          setFileName(name);
          setApiResponse(response);
          setScreen("dashboard");
        }}
      />
    );
  }

  if (screen === "dashboard") {
    return (
      <FlightDashboard
        fileName={fileName}
        apiResponse={apiResponse}
        onBack={() => setScreen("upload")}
        onAccount={() => setScreen("account")}
      />
    );
  }

  return (
    <UploadScreen
      onAnalyzed={(name, response) => {
        setFileName(name);
        setApiResponse(response);
        setScreen("dashboard");
      }}
      onLogout={logout}
      onAccount={() => setScreen("account")}
    />
  );
}