import { RouterProvider, createBrowserRouter } from "react-router"

import HomePage, { action as sendUrlAction } from "./pages/Home"
import {action as queryAction} from "./components/Messenger";
import ChatPage from "./pages/Chat"
import RootLayout from "./pages/Root";
import ErrorPage from "./pages/Error";

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage/>,
    children: [
      { index: true, element: <HomePage />, action: sendUrlAction },
      { path: 'chat', element: <ChatPage />, action: queryAction }
    ]
  },

]);

function App() {


  return <RouterProvider router={router} />
}

export default App

// https://www.youtube.com/watch?v=KuClyhvSzXk
// https://www.youtube.com/watch?v=cSDKkD_6kCo

// promt to chatgpt: 
// I am building a youtube chatbot based on RAG application. my root folder is RAG-Youtube-Chatbot. inside this root folder, there are two sub folders: 1. api --> contains backend code written in fastapi 2. frontend --> contains frontend code written in react and react-router
