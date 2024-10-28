import React from 'react';
import { Card, Col, Select, Switch } from 'antd';

const { Option } = Select;

export type DayOfWeek = 'domingo' | 'segunda-feira' | 'terça-feira' | 'quarta-feira' | 'quinta-feira' | 'sexta-feira' | 'sábado';

interface BusinessHours {
  id: number;
  dayOfWeek: string;
  openingTime: string; // Formato "HH:mm AM/PM"
  closingTime: string; // Formato "HH:mm AM/PM"
  isOpen: boolean;
  sectorId: number;
}

interface OpeningHoursCardProps {
  day: DayOfWeek;
  times: any; // Usando a estrutura BusinessHours
  onTimeChange: (day: DayOfWeek, type: 'open' | 'close', time: string) => void;
  onSwitchChange: (day: DayOfWeek, checked: boolean) => void;
}

const OpeningHoursCard: React.FC<OpeningHoursCardProps> = ({ day, times, onTimeChange, onSwitchChange }) => {
  const openingTime = times.openingTime || "00:00 AM"; // Default fallback
  const closingTime = times.closingTime || "00:00 AM"; // Default fallback

  return (
    <Col xs={24} sm={24} md={24}>
      <Card style={{ padding: '20px', borderRadius: '8px', border: '1px solid #a6a6a6' }} bordered>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0052cc', paddingBottom: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0052cc', margin: 0, textTransform: 'capitalize' }}>
            {day}
          </h3>
          <Switch
            checked={times.isOpen}
            onChange={(checked) => onSwitchChange(day, checked)}
          />
        </div>

        <div style={{ marginTop: '10px' }}>
          {/* Horário de Abertura */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontWeight: 'bold', color: '#0052cc', display: 'block' }}>Abre:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Select
                value={openingTime.split(':')[0]} // Hora
                onChange={(value) => onTimeChange(day, 'open', `${value}:${openingTime.split(':')[1]}`)} // Atualiza com a nova hora
                style={{ width: '60px' }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <Option key={i} value={i + 1}>{i + 1}</Option>
                ))}
              </Select>
              <span>:</span>
              <Select
                value={openingTime.split(':')[1].split(' ')[0]} // Minuto
                onChange={(value) => onTimeChange(day, 'open', `${openingTime.split(':')[0]}:${value}`)} // Atualiza com o novo minuto
                style={{ width: '60px' }}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Option key={i} value={i}>{i < 10 ? `0${i}` : i}</Option>
                ))}
              </Select>
              <Select
                value={openingTime.split(' ')[1]} // Período
                onChange={(value) => onTimeChange(day, 'open', `${openingTime.split(':')[0]}:${openingTime.split(':')[1].split(' ')[0]} ${value}`)} // Atualiza com o novo período
                style={{ width: '80px' }}
              >
                <Option value="AM">AM</Option>
                <Option value="PM">PM</Option>
              </Select>
            </div>
          </div>

          {/* Horário de Fechamento */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontWeight: 'bold', color: '#0052cc', display: 'block' }}>Fecha:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Select
                value={closingTime.split(':')[0]} // Hora
                onChange={(value) => onTimeChange(day, 'close', `${value}:${closingTime.split(':')[1]}`)} // Atualiza com a nova hora
                style={{ width: '60px' }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <Option key={i} value={i + 1}>{i + 1}</Option>
                ))}
              </Select>
              <span>:</span>
              <Select
                value={closingTime.split(':')[1].split(' ')[0]} // Minuto
                onChange={(value) => onTimeChange(day, 'close', `${closingTime.split(':')[0]}:${value}`)} // Atualiza com o novo minuto
                style={{ width: '60px' }}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Option key={i} value={i}>{i < 10 ? `0${i}` : i}</Option>
                ))}
              </Select>
              <Select
                value={closingTime.split(' ')[1]} // Período
                onChange={(value) => onTimeChange(day, 'close', `${closingTime.split(':')[0]}:${closingTime.split(':')[1].split(' ')[0]} ${value}`)} // Atualiza com o novo período
                style={{ width: '80px' }}
              >
                <Option value="AM">AM</Option>
                <Option value="PM">PM</Option>
              </Select>
            </div>
          </div>
        </div>
      </Card>
    </Col>
  );
};

export default OpeningHoursCard;
