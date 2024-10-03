// src/components/Home.js

import React from 'react';
import Sidebar from './Sidebar'; // Importa el Sidebar
import './Home.css'; // Estilos generales




function Home() {
    return (
        <div className="home-container">
            <Sidebar /> {/* Muestra el menú o barra lateral */}
            <main className="main-content">
                <div style={{ padding: 20 }}>
                    <h2>Bienvenido a la Ferretería</h2>
                    {/* Aquí puedes agregar más contenido del Home si es necesario */}
                </div>
            </main>
        </div>
    );
}

export default Home;
