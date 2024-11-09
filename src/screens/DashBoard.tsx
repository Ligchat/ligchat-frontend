import React, { useState, useEffect } from 'react';
import { Card, Col, Row, DatePicker, Typography, Spin } from 'antd';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { getWhatsAppContacts, WhatsAppContact } from '../services/WhatsappContactService';
import SessionService from '../services/SessionService';
import { SmileTwoTone } from '@ant-design/icons';
import LoadingOverlay from '../components/LoadingOverlay';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [contactsToday, setContactsToday] = useState<number>(0);
  const [contactsWeekly, setContactsWeekly] = useState<number>(0);
  const [contactsMonthly, setContactsMonthly] = useState<number>(0);
  const [whatsAppContacts, setWhatsAppContacts] = useState<WhatsAppContact[]>([]);
  const [data, setData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: 'Contatos',
        data: [],
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.4,
      },
    ],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const options = {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: (tooltipItems: any) => {
            return `Data: ${tooltipItems[0].label}`;
          },
          label: (tooltipItem: any) => `Contatos: ${tooltipItem.raw}`,
        },
      },
    },
  };

  const calculateContacts = (
    contacts: WhatsAppContact[],
    startDate: Date,
    endDate: Date
  ) => {
    const dataMap: { [key: string]: number } = {};
    const labels: string[] = [];
    const dataPoints: number[] = [];

    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);

    if (dayDiff <= 31) {
      // Exibir dias
      const currentDate = new Date(startDate);
      const dateKeys: string[] = [];

      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const label = currentDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });
        labels.push(label);
        dateKeys.push(dateKey);
        dataMap[dateKey] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      contacts.forEach((contact) => {
        const createdAt = new Date(contact.createdAt);
        const dateKey = createdAt.toISOString().split('T')[0];
        if (dataMap[dateKey] !== undefined) {
          dataMap[dateKey] += 1;
        }
      });

      dateKeys.forEach((dateKey) => {
        dataPoints.push(dataMap[dateKey] || 0);
      });
    } else {
      // Exibir meses
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      const monthKeys: string[] = [];

      while (currentDate <= endMonth) {
        const monthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        const label = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
        labels.push(label);
        monthKeys.push(monthKey);
        dataMap[monthKey] = 0;
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      contacts.forEach((contact) => {
        const createdAt = new Date(contact.createdAt);
        const monthKey = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        if (dataMap[monthKey] !== undefined) {
          dataMap[monthKey] += 1;
        }
      });

      monthKeys.forEach((monthKey) => {
        dataPoints.push(dataMap[monthKey] || 0);
      });
    }

    setData({
      labels,
      datasets: [{ ...data.datasets[0], data: dataPoints }],
    });

    // Atualizar contadores de contatos usando todos os contatos
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Início do dia de hoje

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 6); // Últimos 7 dias incluindo hoje
    oneWeekAgo.setHours(0, 0, 0, 0); // Início do dia de 'oneWeekAgo'

    // Contatos Hoje
    const contactsTodayCount = contacts.filter((contact) => {
      const createdAt = new Date(contact.createdAt);
      return createdAt >= today;
    }).length;
    setContactsToday(contactsTodayCount);

    // Contatos Semanais
    const contactsWeeklyCount = contacts.filter((contact) => {
      const createdAt = new Date(contact.createdAt);
      return createdAt >= oneWeekAgo && createdAt <= today;
    }).length;
    setContactsWeekly(contactsWeeklyCount);

    // Contatos Mensais
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const contactsMonthlyCount = contacts.filter((contact) => {
      const createdAt = new Date(contact.createdAt);
      return (
        createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear
      );
    }).length;
    setContactsMonthly(contactsMonthlyCount);
  };

  const fetchContactsByDateRange = async (dates: any) => {
    const startDate = dates[0].startOf('day').toDate();
    const endDate = dates[1].endOf('day').toDate();

    try {
      setIsLoading(true);
      const sectorId = SessionService.getSessionForSector();
      const contacts = await getWhatsAppContacts(sectorId);
      setWhatsAppContacts(contacts);

      const filteredContacts = contacts.filter((contact) => {
        const createdAt = new Date(contact.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });

      calculateContacts(filteredContacts, startDate, endDate);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialContacts = async () => {
      setIsLoading(true);
      const sectorId = SessionService.getSessionForSector();
      const contacts = await getWhatsAppContacts(sectorId);
      setWhatsAppContacts(contacts);

      // Centralizando o dia atual
      const today = new Date();
      const daysToShow = 14; // Total de dias no gráfico
      const halfDays = Math.floor(daysToShow / 2);

      const startDate = new Date(today);
      startDate.setDate(today.getDate() - halfDays);

      const endDate = new Date(today);
      endDate.setDate(today.getDate() + halfDays);

      calculateContacts(contacts, startDate, endDate);
      setIsLoading(false);
    };

    fetchInitialContacts();
  }, []);

  const handleDateChange = (dates: any) => {
    fetchContactsByDateRange(dates);
  };

  return (
    <div style={{ padding: '24px' }}>
      {isLoading && <LoadingOverlay />}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Title style={{color: '#1890ff'}} level={4}>Contatos Hoje</Title>
            <p>{contactsToday}</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Title style={{color: '#1890ff'}} level={4}>Contatos Semanais</Title>
            <p>{contactsWeekly}</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Title style={{color: '#1890ff'}} level={4}>Contatos Mensais</Title>
            <p>{contactsMonthly}</p>
          </Card>
        </Col>
      </Row>

      <Card style={{ background: 'linear-gradient(90deg, #3A58B9 0%, #14B8A6 100%)', marginTop: 24 }}>
        <Row align="middle">
          <Col span={18}>
            <Title style={{color:'white'}} level={4}>Métricas</Title>
            <p style={{color:'white'}}>CSAT</p>
            <span style={{ fontSize: '40px', fontWeight: 'bold', color:'white' }}>{((contactsToday + contactsWeekly + contactsMonthly) / 3).toFixed(1)}</span>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            {parseFloat(((contactsToday + contactsWeekly + contactsMonthly) / 3).toFixed(1)) < 0.5 ? <SmileTwoTone style={{ fontSize: '60px' }} twoToneColor="#eb2f96" /> : <SmileTwoTone style={{ fontSize: '60px', marginRight:20 }} twoToneColor="#52c41a" />}
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Title level={4}>Filtrar por período</Title>
          </Col>
          <Col>
            <RangePicker onChange={handleDateChange} />
          </Col>
        </Row>

        <div style={{ marginTop: 24, height: '300px' }}>
          <Line data={data} options={options} />
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;