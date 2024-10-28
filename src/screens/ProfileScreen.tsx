import React from 'react';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;

const ProfileScreen: React.FC = () => {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  return (
    <Layout className="layout">
      <Content style={{ padding: '50px', textAlign: 'center' }}>
        <Title level={2}>Profile</Title>
        <Text strong>Name:</Text> <Text>{user.name}</Text> <br />
        <Text strong>Email:</Text> <Text>{user.email}</Text>
      </Content>
    </Layout>
  );
};

export default ProfileScreen;
