import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply dark mode by default (saved preference or dark as default)
const saved = localStorage.getItem("tara_theme");
if (saved === "light") {
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
