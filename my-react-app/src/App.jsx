import { useState } from "react";
import UploadScreen from "./components/UploadScreen";
import FlightDashboard from "./pages/FlightDashboard";

export default function DroneLogAnalyzer() {
  const [screen, setScreen] = useState("upload"); // "upload" | "dashboard"
  const [fileName, setFileName] = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  if (screen === "dashboard") {
    return (
      <FlightDashboard
        fileName={fileName}
        apiResponse={apiResponse}
        onBack={() => {
          setScreen("upload");
          setFileName("");
          setApiResponse(null);
        }}
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
    />
  );
}