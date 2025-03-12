import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import { useEffect, useState } from "react";
import MainLayout from "./components/layouts/MainLayout";
import Home from "@/pages/Home";
import Users from "@/pages/Users";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Quotes from "@/pages/Quotes";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import type { Company } from "@shared/schema";

function Router() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="users" element={<Users />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/company/settings');
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
        document.title = `${data.name} - Quote System`;
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;