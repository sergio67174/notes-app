import React from "react";
import RegisterPage from "./RegisterPage";
import "./index.css";

/**
 * Root application component.
 * For Phase 1 it only renders the RegisterPage.
 *
 * Later we can add routing (e.g. register, login, board).
 *
 * @returns {JSX.Element} The app root component.
 */
export default function App() {
  return <RegisterPage />;
}