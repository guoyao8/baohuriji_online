import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useFeedingStore } from './stores/feedingStore';
import Login from './pages/Login';
import Home from './pages/Home';
import AddRecord from './pages/AddRecord';
import EditRecord from './pages/EditRecord';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import BabyProfile, { AddBaby, FamilySettings, ReminderSettings, EditBaby } from './pages/BabyProfile';
import AccountSettings from './pages/AccountSettings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();
  const { fetchBabies } = useFeedingStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
      fetchBabies();
    }
  }, [isAuthenticated, fetchUser, fetchBabies]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-record"
          element={
            <PrivateRoute>
              <AddRecord />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-record/:id"
          element={
            <PrivateRoute>
              <EditRecord />
            </PrivateRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <PrivateRoute>
              <Stats />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/baby-profile"
          element={
            <PrivateRoute>
              <BabyProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-baby"
          element={
            <PrivateRoute>
              <AddBaby />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-baby/:id"
          element={
            <PrivateRoute>
              <EditBaby />
            </PrivateRoute>
          }
        />
        <Route
          path="/family-settings"
          element={
            <PrivateRoute>
              <FamilySettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/reminder-settings"
          element={
            <PrivateRoute>
              <ReminderSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/account-settings"
          element={
            <PrivateRoute>
              <AccountSettings />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
