import React, { createContext, useContext, useState } from 'react';

interface MenuContextType {
  drawerVisible: boolean;
  setDrawerVisible: (visible: boolean) => void;
  drawerType: 'menu' | 'chat' | null;
  setDrawerType: (type: 'menu' | 'chat' | null) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState<'menu' | 'chat' | null>(null);

  return (
    <MenuContext.Provider value={{ 
      drawerVisible, 
      setDrawerVisible,
      drawerType,
      setDrawerType
    }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}; 