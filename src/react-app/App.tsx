import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import ServicesPage from "@/react-app/pages/Services";
import DashboardPage from "@/react-app/pages/Dashboard";
import PetDetailsPage from "@/react-app/pages/PetDetails";
import AuthPage from "@/react-app/pages/Auth";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import SubscriptionsPage from "@/react-app/pages/Subscriptions";
import ProfileSettingsPage from "@/react-app/pages/ProfileSettings";
import GroomingBookPage from "@/react-app/pages/GroomingBook";
import GroomingCheckoutPage from "@/react-app/pages/GroomingCheckout";
import GroomingConfirmPage from "@/react-app/pages/GroomingConfirm";
import GroomingConfirmedPage from "@/react-app/pages/GroomingConfirmed";
import MyBookingsPage from "@/react-app/pages/MyBookings";
import DoctorBookPage from "@/react-app/pages/DoctorBook";
import DoctorCheckoutPage from "@/react-app/pages/DoctorCheckout";
import DoctorConfirmPage from "@/react-app/pages/DoctorConfirm";
import DoctorConfirmedPage from "@/react-app/pages/DoctorConfirmed";
import MyAppointmentsPage from "@/react-app/pages/MyAppointments";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pets/:petId" element={<PetDetailsPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/settings" element={<ProfileSettingsPage />} />
          <Route path="/grooming/book" element={<GroomingBookPage />} />
          <Route path="/grooming/checkout" element={<GroomingCheckoutPage />} />
          <Route path="/grooming/confirm/:id" element={<GroomingConfirmPage />} />
          <Route path="/grooming/confirmed" element={<GroomingConfirmedPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/doctor/book" element={<DoctorBookPage />} />
          <Route path="/doctor/checkout" element={<DoctorCheckoutPage />} />
          <Route path="/doctor/confirm/:id" element={<DoctorConfirmPage />} />
          <Route path="/doctor/confirmed" element={<DoctorConfirmedPage />} />
          <Route path="/appointments" element={<MyAppointmentsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
