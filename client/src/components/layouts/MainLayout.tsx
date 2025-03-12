import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { Layout, Menu, Button, message, Image } from "antd";
import { 
  HomeOutlined, 
  UserOutlined, 
  ShopOutlined, 
  AppstoreOutlined, 
  FileTextOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  LogoutOutlined,
  SettingOutlined 
} from "@ant-design/icons";
import LoginModal from "../auth/LoginModal";
import type { Company } from "@shared/schema";
import { userService } from "../../services/users";
import { queryClient } from "@/lib/queryClient";

const { Sider, Content } = Layout;

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    checkAuth();
    fetchCompanySettings();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setShowLoginModal(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/company/settings');
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      setShowLoginModal(true);
      // Clear user cache on logout
      userService.clearCache();
      // Clear all queries from the cache
      queryClient.clear();
      message.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      message.error('Logout failed');
    }
  };

  const menuItems = [
    { key: "/", icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
    { key: "/users", icon: <UserOutlined />, label: <Link to="/users">Users</Link> },
    { key: "/products", icon: <ShopOutlined />, label: <Link to="/products">Products</Link> },
    { key: "/categories", icon: <AppstoreOutlined />, label: <Link to="/categories">Categories</Link> },
    { key: "/quotes", icon: <FileTextOutlined />, label: <Link to="/quotes">Quotes</Link> },
    { key: "/settings", icon: <SettingOutlined />, label: <Link to="/settings">Settings</Link> },
    { 
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
      className: "mt-auto",
    },
  ];

  if (showLoginModal) {
    return (
      <LoginModal
        open={showLoginModal}
        onSuccess={() => {
          setShowLoginModal(false);
          checkAuth();
        }}
      />
    );
  }

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="fixed left-0 top-0 bottom-0 z-10"
        theme="light"
      >
        <div className="h-16 flex items-center justify-center bg-primary">
          {company?.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={company.name}
              preview={false}
              height={collapsed ? 32 : 48}
              className="object-contain"
            />
          ) : (
            <h1 className="text-white text-xl font-bold">
              {collapsed ? "QS" : company?.name || "QuoteSystem"}
            </h1>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
        <Button
          type="text"
          className="absolute bottom-4 right-0 left-0 mx-auto w-8 h-8 flex items-center justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Content className="container mx-auto px-4 py-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}