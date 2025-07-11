import { useState } from "react";
import LandingPage from "./LandingPage";
import AppUI from "./AppUI";

export default function App() {
  const [started, setStarted] = useState(
    sessionStorage.getItem("user_id") !== null
  );
  const [isBaseline, setIsBaseline] = useState(() => {
    const stored = sessionStorage.getItem("is_baseline");
    return stored !== null ? JSON.parse(stored) : false;
  });

  return started ? (
    <AppUI isBaseline={isBaseline} />
  ) : (
    <LandingPage
      onStart={(selectedCondition) => {
        setIsBaseline(selectedCondition);
        setStarted(true);
      }}
    />
  );
}
