import React from 'react';
import { Select } from '../components/CustomComponents';

export type DayOfWeek = 'domingo' | 'segunda-feira' | 'terça-feira' | 'quarta-feira' | 'quinta-feira' | 'sexta-feira' | 'sábado';

interface BusinessHours {
  id: number;
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
  sectorId: number;
}

interface OpeningHoursCardProps {
  day: DayOfWeek;
  times: any;
  onTimeChange: (day: DayOfWeek, type: 'open' | 'close', time: string) => void;
  onSwitchChange: (day: DayOfWeek, checked: boolean) => void;
}

const OpeningHoursCard: React.FC<OpeningHoursCardProps> = ({ day, times, onTimeChange, onSwitchChange }) => {
  const openingTime = times.openingTime || "00:00 AM";
  const closingTime = times.closingTime || "00:00 AM";

  const hoursOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1)
  }));

  const minutesOptions = Array.from({ length: 60 }, (_, i) => ({
    value: String(i < 10 ? `0${i}` : i),
    label: String(i < 10 ? `0${i}` : i)
  }));

  const periodOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ];

  return (
    <div className="col-span-24">
      <div className="p-5 rounded-lg border border-gray-400">
        <div className="flex justify-between items-center border-b-2 border-blue-600 pb-2.5">
          <h3 className="text-lg font-bold text-blue-600 m-0 capitalize">
            {day}
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={times.isOpen}
              onChange={(e) => onSwitchChange(day, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="mt-2.5">
          <div className="mb-2.5">
            <label className="font-bold text-blue-600 block">Abre:</label>
            <div className="flex items-center gap-1">
              <Select
                value={openingTime.split(':')[0]}
                onChange={(value) => onTimeChange(day, 'open', `${value}:${openingTime.split(':')[1]}`)}
                options={hoursOptions}
                className="w-16"
              />
              <span>:</span>
              <Select
                value={openingTime.split(':')[1].split(' ')[0]}
                onChange={(value) => onTimeChange(day, 'open', `${openingTime.split(':')[0]}:${value}`)}
                options={minutesOptions}
                className="w-16"
              />
              <Select
                value={openingTime.split(' ')[1]}
                onChange={(value) => onTimeChange(day, 'open', `${openingTime.split(':')[0]}:${openingTime.split(':')[1].split(' ')[0]} ${value}`)}
                options={periodOptions}
                className="w-20"
              />
            </div>
          </div>

          <div className="mb-2.5">
            <label className="font-bold text-blue-600 block">Fecha:</label>
            <div className="flex items-center gap-1">
              <Select
                value={closingTime.split(':')[0]}
                onChange={(value) => onTimeChange(day, 'close', `${value}:${closingTime.split(':')[1]}`)}
                options={hoursOptions}
                className="w-16"
              />
              <span>:</span>
              <Select
                value={closingTime.split(':')[1].split(' ')[0]}
                onChange={(value) => onTimeChange(day, 'close', `${closingTime.split(':')[0]}:${value}`)}
                options={minutesOptions}
                className="w-16"
              />
              <Select
                value={closingTime.split(' ')[1]}
                onChange={(value) => onTimeChange(day, 'close', `${closingTime.split(':')[0]}:${closingTime.split(':')[1].split(' ')[0]} ${value}`)}
                options={periodOptions}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningHoursCard;
