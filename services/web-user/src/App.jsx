import { Routes, Route, Navigate } from "react-router-dom";
import Favorites from "./pages/Favorites";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import CanteenMenu from "./pages/CanteenMenu";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={<ProtectedRoute><Home /></ProtectedRoute>}
        />
        <Route
          path="/canteen/:id"
          element={<ProtectedRoute><CanteenMenu /></ProtectedRoute>}
        />
        <Route
          path="/checkout"
          element={<ProtectedRoute><Checkout /></ProtectedRoute>}
        />
        <Route
          path="/orders"
          element={<ProtectedRoute><MyOrders /></ProtectedRoute>}
        />
        <Route
          path="/notifications"
          element={<ProtectedRoute><Notifications /></ProtectedRoute>}
        />
        <Route
         path="/favorites"
         element={<ProtectedRoute><Favorites /></ProtectedRoute>}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
