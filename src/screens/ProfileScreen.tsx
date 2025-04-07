import React from 'react';

const ProfileScreen: React.FC = () => {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  return (
    <div className="layout">
      <main style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Profile</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </main>
    </div>
  );
};

export default ProfileScreen;
