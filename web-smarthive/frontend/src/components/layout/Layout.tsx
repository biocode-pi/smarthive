import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const publicRoutes = ["/login", "/cadastro"];

export function Layout({ children, title }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isPublicRoute = publicRoutes.includes(location.pathname);

    if (!token && !isPublicRoute) {
      navigate("/login");
    }
  }, [navigate, location.pathname]);

  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
