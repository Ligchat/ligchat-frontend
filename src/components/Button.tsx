import React from 'react';
import { Button } from 'antd';

const CustomButton = ({ label }: { label: string }) => (
  <Button className="bg-blue-500 text-white">{label}</Button>
);

export default CustomButton;
