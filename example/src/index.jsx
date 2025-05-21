import { createRoot } from "react-dom/client";
import Brian from "./assets/Brian_Griffin.png?jsx";

const root = createRoot(document.getElementById("root"));

function App() {
  return (
    <div>
      <Brian />
    </div>
  );
}

root.render(<App />);
