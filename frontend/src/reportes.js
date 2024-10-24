import React, { useState } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers'; 
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; 
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx'; 
import { saveAs } from 'file-saver'; 
import jsPDF from 'jspdf'; 
import 'jspdf-autotable'; 
import Sidebar from './Sidebar';
import { Bar } from 'react-chartjs-2';  // Cambiamos a gráfico de barras
import './Home.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3000'
// Registro de los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Reportes() {
  const [ventas, setVentas] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  const cargarVentas = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("Por favor selecciona un rango de fechas.");
      return;
    }
  
    try {
      const fechaInicioFormatted = fechaInicio.toISOString().split('T')[0];
      const fechaFinFormatted = fechaFin.toISOString().split('T')[0];
  
      const response = await fetch(`${URL}/api/ventas?fechaInicio=${fechaInicioFormatted}&fechaFin=${fechaFinFormatted}`);
      const data = await response.json();
      
      console.log('Datos de la API:', data);
      setVentas(data); // Actualizar el estado con los datos recibidos
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  };

  const descargarExcel = () => {
    const hojaDeCalculo = XLSX.utils.json_to_sheet(ventas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hojaDeCalculo, 'Ventas');
    const archivoExcel = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([archivoExcel]), 'reporte_ventas.xlsx');
  };

  const descargarPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Ventas', 20, 10);
    doc.autoTable({
      head: [['Producto', 'Marca', 'Tipo de Medida', 'Cantidad', 'Precio de Costo', 'Precio de Venta', 'Total']],
      body: ventas.map(venta => [
        venta.producto || 'No disponible',
        venta.marca || 'No disponible',
        venta.tipo_medida || 'No disponible',
        venta.cantidad || '0',
        typeof parseFloat(venta.precio_compra) === 'number' && !isNaN(parseFloat(venta.precio_compra))
          ? `$${parseFloat(venta.precio_compra).toFixed(2)}`
          : 'No disponible',
        typeof parseFloat(venta.precio_unitario) === 'number' && !isNaN(parseFloat(venta.precio_unitario))
          ? `$${parseFloat(venta.precio_unitario).toFixed(2)}`
          : 'No disponible',
        typeof parseFloat(venta.total) === 'number' && !isNaN(parseFloat(venta.total))
          ? `$${parseFloat(venta.total).toFixed(2)}`
          : '$0.00',
        venta.usuario || 'N/A'
      ])
    });
    doc.save('reporte_ventas.pdf');
  };

  // Preparar los datos para el gráfico de barras
  const fechas = ventas.map(venta => new Date(venta.fecha).toLocaleDateString());
  const totalVendido = ventas.map(venta => venta.total);
  const costosTotales = ventas.map(venta => (venta.cantidad * venta.precio_compra).toFixed(2));
  const gananciaTotal = ventas.map(venta => (venta.cantidad * (venta.precio_unitario - venta.precio_compra)).toFixed(2));

  const data = {
    labels: fechas,
    datasets: [
      {
        label: 'Total Vendido',
        data: totalVendido,
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Color rojo para ventas
        borderWidth: 1,
      },
      {
        label: 'Costos',
        data: costosTotales,
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Color azul para costos
        borderWidth: 1,
      },
      {
        label: 'Ganancias',
        data: gananciaTotal,
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Color verde para ganancias
        borderWidth: 1,
      }
    ]
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `$${value}`; // Agregar formato de dólares en el eje Y
          }
        }
      }
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            // Verificar si el valor es un número antes de aplicar toFixed
            if (typeof tooltipItem.raw === 'number') {
              return `$${tooltipItem.raw.toFixed(2)}`;
            } else {
              return `$${tooltipItem.raw}`; // Devolver como está si no es un número
            }
          }
        }
      }
    }
  };
  

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="home-container">
        <Sidebar />
        <main className="main-content">
          <h2>Reporte de Ventas</h2>

          <div style={{ marginBottom: 20 }}>
            <DatePicker
              label="Fecha de inicio"
              value={fechaInicio}
              onChange={(newValue) => setFechaInicio(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
            <DatePicker
              label="Fecha de fin"
              value={fechaFin}
              onChange={(newValue) => setFechaFin(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
            <Button variant="contained" color="primary" onClick={cargarVentas}>
              Buscar Ventas
            </Button>
          </div>

          {/* Gráfico de ventas, costos y ganancias */}
          <div style={{ marginBottom: 40 }}>
            <Bar data={data} options={options} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Button variant="contained" color="primary" style={{ marginRight: 10 }} onClick={descargarExcel}>
              Descargar Excel
            </Button>
            <Button variant="contained" color="primary" onClick={descargarPDF}>
              Descargar PDF
            </Button>
            <CSVLink
              data={ventas}
              filename="reporte_ventas.csv"
              className="btn btn-primary"
              style={{ marginLeft: 10 }}
            >
              Descargar CSV
            </CSVLink>
          </div>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell>Tipo de Medida</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Precio de Costo</TableCell>
                  <TableCell>Precio de Venta Unitario</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventas.map((venta, index) => (
                  <TableRow key={index}>
                    <TableCell>{venta.producto}</TableCell>
                    <TableCell>{venta.marca}</TableCell>
                    <TableCell>{venta.tipo_medida}</TableCell>
                    <TableCell>{venta.cantidad}</TableCell>
                    <TableCell>
                      {venta.precio_compra !== undefined && venta.precio_compra !== null && !isNaN(venta.precio_compra)
                        ? `$${parseFloat(venta.precio_compra).toFixed(2)}`
                        : 'No disponible'}
                    </TableCell>
                    <TableCell>{`$${parseFloat(venta.precio_unitario).toFixed(2)}`}</TableCell>
                    <TableCell>{`$${parseFloat(venta.total).toFixed(2)}`}</TableCell>
                    <TableCell>{new Date(venta.fecha).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </main>
      </div>
    </LocalizationProvider>
  );
}

export default Reportes;
