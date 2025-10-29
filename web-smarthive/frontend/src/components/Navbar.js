'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import Badge from 'react-bootstrap/Badge';
import styles from './Sidebar.module.css';

export default function Navbar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState({});
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    const notificationCount = parseInt(localStorage.getItem('notificationCount') || '0');
    setNotifications(notificationCount);

    const handleNewNotification = () => {
      const updatedCount = parseInt(localStorage.getItem('notificationCount') || '0');
      setNotifications(updatedCount);
    };

    window.addEventListener('newNotification', handleNewNotification);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path) => {
    const fullPath = `/dashboard${path}`;
    return pathname === fullPath || pathname.startsWith(fullPath + '/') ? 'active' : '';
  };

  return (
    <>
      <style jsx global>{`
        ${sidebarStyles}
      `}</style>
      
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <i className="fas fa-hexagon"></i>
            <span className="logo-text">Smart Hive</span>
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <i className={`fas fa-${collapsed ? 'chevron-right' : 'chevron-left'}`}></i>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            <i className="fas fa-user"></i>
          </div>
          <div className="user-info">
            <h5 className="mb-0">{user.nome || user.username}</h5>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className={isActive('/dashboard')}>
            <Link href="/dashboard/dashboard">
              <i className="fas fa-chart-pie"></i>
              <span>Visão Geral</span>
            </Link>
          </li>
          <li className={isActive('/grafico-dashboard')}>
            <Link href="/dashboard/grafico-dashboard">
              <i className="fas fa-chart-line"></i>
              <span>Dashboard</span>
            </Link>
          </li>

          <li className="menu-header">Gerenciamento</li>

          <li className={isActive('/apiarios')}>
            <Link href="/dashboard/apiarios">
              <i className="fas fa-leaf"></i>
              <span>Apiários</span>
            </Link>
          </li>

          <li className={isActive('/colmeias')}>
            <Link href="/dashboard/colmeias">
              <i className="fas fa-home"></i>
              <span>Colmeias</span>
            </Link>
          </li>

          <li className="menu-header">Monitoramento</li>

          <li className={isActive('/cadastro')}>
            <Link href="/dashboard/cadastro">
              <i className="fas fa-plus"></i>
              <span>Novo Registro</span>
            </Link>
          </li>

          <li className={isActive('/lista')}>
            <Link href="/dashboard/lista">
              <i className="fas fa-list"></i>
              <span>Registros</span>
            </Link>
          </li>

          <li className={isActive('/alertas')}>
            <Link href="/dashboard/alertas">
              <i className="fas fa-bell"></i>
              <span>Alertas</span>
              {notifications > 0 && (
                <Badge bg="danger" pill className="ms-auto notification-badge">{notifications}</Badge>
              )}
            </Link>
          </li>

          <li className={isActive('/configuracoes')}>
            <Link href="/dashboard/configuracoes">
              <i className="fas fa-cog"></i>
              <span>Configurações</span>
            </Link>
          </li>
        </ul>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className={`top-navbar ${collapsed ? 'expanded' : ''}`}>
        <div className="d-flex align-items-center">
          <button className="menu-toggle me-3" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
          <h4 className="mb-0 d-none d-md-block fw-semibold">{
            pathname === '/dashboard/dashboard' ? 'Visão Geral' :
              pathname === '/dashboard/grafico-dashboard' ? 'Dashboard de Análise' :
                pathname === '/dashboard/apiarios' ? 'Gerenciamento de Apiários' :
                  pathname === '/dashboard/cadastro' ? 'Novo Monitoramento' :
                    pathname === '/dashboard/lista' ? 'Registros de Monitoramento' :
                      pathname === '/dashboard/colmeias' ? 'Gerenciamento de Colmeias' :
                        pathname === '/dashboard/alertas' ? 'Sistema de Alertas' :
                          pathname === '/dashboard/configuracoes' ? 'Configurações do Sistema' : 'Smart Hive'
          }</h4>
        </div>
        <div className="top-navbar-right">
          <Link href="/dashboard/alertas" className="notification-bell">
            <i className="fas fa-bell"></i>
            {notifications > 0 && (
              <span className="badge">{notifications}</span>
            )}
          </Link>
          <div className="user-dropdown">
            <button className="user-dropdown-toggle">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary-light p-2 me-2">
                  <i className="fas fa-user text-primary"></i>
                </div>
                <span className="d-none d-md-inline">{user.nome || user.username}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="content-wrapper"></div>
    </>
  );
}

const sidebarStyles = `
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 280px;
  background: #FFFFFF;
  color: var(--text-primary);
  transition: all 0.3s;
  box-shadow: 0 0 20px rgba(0,0,0,0.05);
  z-index: 1000;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar.collapsed {
  width: 80px;
  background: linear-gradient(to bottom, #FFC107, #FFCA28);
  box-shadow: 3px 0 15px rgba(0,0,0,0.08);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: var(--primary-gradient);
  color: white;
  height: 70px;
}

.logo {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.3rem;
  font-family: var(--font-heading);
}

.logo i {
  font-size: 1.8rem;
  margin-right: 12px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.sidebar.collapsed .logo i {
  font-size: 2rem;
  margin-right: 0;
  margin-left: 5px;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 15px 0 0 0;
}

.menu-header {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 12px 24px 8px;
  letter-spacing: 1px;
  opacity: 0.7;
}

.sidebar-menu li a {
  display: flex;
  align-items: center;
  color: var(--text-primary);
  text-decoration: none;
  padding: 14px 24px;
  font-size: 0.95rem;
  transition: all 0.2s;
  border-radius: 0;
  margin: 2px 12px;
  border-radius: 12px;
}

.sidebar.collapsed .sidebar-menu li a {
  justify-content: center;
  padding: 14px 10px;
  margin: 5px;
}

.sidebar-menu li a i {
  font-size: 18px;
  min-width: 25px;
  margin-right: 10px;
  text-align: center;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.sidebar.collapsed .sidebar-menu li a i {
  font-size: 20px;
  margin-right: 0;
  min-width: auto;
  color: #333;
}

.sidebar-menu li.active a {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 500;
}

.sidebar-menu li.active a i {
  color: var(--primary);
}

.sidebar-menu li a:hover {
  background-color: #F6F8FA;
  color: var(--primary);
}

.sidebar-menu li a:hover i {
  color: var(--primary);
}

.notification-badge {
  height: 20px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
  font-size: 11px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.sidebar.collapsed .menu-header, 
.sidebar.collapsed .user-info,
.sidebar.collapsed .sidebar-menu li a span,
.sidebar.collapsed .logout-btn span {
  display: none;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: calc(100% - 24px);
  padding: 14px 24px;
  border: none;
  background: #f8f9fa;
  color: #DC3545;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  margin: 12px;
}

.sidebar.collapsed .logout-btn {
  justify-content: center;
  padding: 14px;
  width: 60px;
  margin: 12px auto;
}

.logout-btn:hover {
  background-color: #FEE2E2;
  color: #DC3545;
}

.sidebar-user {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(to right, #f8f9fa, #ffffff);
}

.sidebar.collapsed .sidebar-user {
  justify-content: center;
  padding: 15px 10px;
}

.user-avatar {
  width: 46px;
  height: 46px;
  margin-right: 12px;
  background: var(--primary-gradient);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(255, 193, 7, 0.3);
}

.sidebar.collapsed .user-avatar {
  margin-right: 0;
}

.user-avatar i {
  font-size: 22px;
  color: white;
}

.top-navbar {
  height: 70px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.04);
  position: fixed;
  top: 0;
  right: 0;
  left: 280px;
  z-index: 990;
  transition: all 0.3s;
}

.top-navbar.expanded {
  left: 80px;
}

.menu-toggle {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #495057;
  cursor: pointer;
  transition: transform 0.3s;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-toggle:hover {
  background-color: #f8f9fa;
  transform: scale(1.05);
  color: var(--primary);
}

.top-navbar-right {
  display: flex;
  align-items: center;
}

.notification-bell {
  position: relative;
  margin-right: 24px;
  cursor: pointer;
  transition: transform 0.3s;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  text-decoration: none;
}

.notification-bell:hover {
  background-color: #f8f9fa;
  transform: scale(1.05);
}

.notification-bell i {
  font-size: 18px;
  color: #6c757d;
}

.notification-bell .badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-dropdown {
  position: relative;
}

.user-dropdown-toggle {
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #495057;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.3s;
}

.user-dropdown-toggle:hover {
  background-color: #f8f9fa;
}

.toggle-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.3s, background 0.3s;
  position: relative;
  z-index: 1;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  transform: scale(1.1);
  background: rgba(255,255,255,0.3);
}

@media (max-width: 992px) {
  .sidebar {
    width: 80px;
  }
  
  .sidebar .logo-text,
  .sidebar .user-info,
  .sidebar span:not(.badge) {
    display: none;
  }
  
  .top-navbar {
    left: 80px;
  }
  
  .sidebar.collapsed {
    width: 280px;
  }
  
  .sidebar.collapsed .logo-text,
  .sidebar.collapsed .user-info,
  .sidebar.collapsed span:not(.badge) {
    display: inline-block;
  }
  
  .top-navbar.expanded {
    left: 280px;
  }
}
`;

