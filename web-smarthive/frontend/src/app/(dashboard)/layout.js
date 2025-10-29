'use client';

import { useAuth } from '../providers';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="page-content">
        <div className="container-fluid p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

