import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore } from './stores/authStore';
import { useFeedingStore } from './stores/feedingStore';
import Login from './pages/Login';
import Home from './pages/Home';

// 延迟加载非关键组件
const AddRecord = lazy(() => import('./pages/AddRecord'));
const EditRecord = lazy(() => import('./pages/EditRecord'));
const Stats = lazy(() => import('./pages/Stats'));
const Settings = lazy(() => import('./pages/Settings'));
const BabyProfile = lazy(() => import('./pages/BabyProfile').then(m => ({ default: m.default })));
const AddBaby = lazy(() => import('./pages/BabyProfile').then(m => ({ default: m.AddBaby })));
const FamilySettings = lazy(() => import('./pages/BabyProfile').then(m => ({ default: m.FamilySettings })));
const ReminderSettings = lazy(() => import('./pages/BabyProfile').then(m => ({ default: m.ReminderSettings })));
const EditBaby = lazy(() => import('./pages/BabyProfile').then(m => ({ default: m.EditBaby })));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

// Loading 组件
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
          progress_activity
        </span>
        <p className="text-zinc-600 dark:text-zinc-400">加载中...</p>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();
  const { fetchBabies } = useFeedingStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (isAuthenticated && !isInitialized) {
        try {
          await Promise.all([
            fetchUser(),
            fetchBabies(), // 会使用缓存
          ]);
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize app:', error);
        }
      }
    };
    
    initialize();
  }, [isAuthenticated]); // 只在登录状态变化时执行

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
              <Suspense fallback={<LoadingFallback />}>
                <AddRecord />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-record/:id"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <EditRecord />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Stats />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Settings />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/baby-profile"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <BabyProfile />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/add-baby"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AddBaby />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-baby/:id"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <EditBaby />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/family-settings"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FamilySettings />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/reminder-settings"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ReminderSettings />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/account-settings"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AccountSettings />
              </Suspense>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
