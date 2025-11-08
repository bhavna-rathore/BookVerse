import { createContext, useEffect, useReducer } from "react";
import Reducer from "./Reducer";

const INITIAL_STATE = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  isFetching: false,
  error: false,
  theme: localStorage.getItem("theme") || "light",
  readerMode: localStorage.getItem("readerMode") === "true" || false
};

export const Context = createContext(INITIAL_STATE);

export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, INITIAL_STATE);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(state.user));
    localStorage.setItem("theme", state.theme);
    localStorage.setItem("readerMode", state.readerMode);

    // Update document attributes for theme/reader mode
    document.documentElement.setAttribute("data-theme", state.theme);
    document.documentElement.setAttribute("data-reader", state.readerMode);
  }, [state.user, state.theme, state.readerMode]);

  return (
    <Context.Provider
      value={{
        user: state.user,
        isFetching: state.isFetching,
        error: state.error,
        theme: state.theme,
        readerMode: state.readerMode,
        dispatch,
      }}
    >
      {children}
    </Context.Provider>
  );
};