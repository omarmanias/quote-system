import { Card, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function Home() {
  return (
    <div className="space-y-6">
      <Title level={2}>Welcome to User Management</Title>

      <Card title="Features" className="max-w-md">
        <ul className="space-y-2">
          {[
            "Company and user management interface",
            "Database storage",
            "Secure API",
            "Modern user interface with ant design",
            "Ability to create new product categories",
            "Add images to products",
            "Select template to display terms and conditions",
            "Email quote to user if status is “approved”",
            "Schedule appointment with representative for visit",
          ].map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircleOutlined className="text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
