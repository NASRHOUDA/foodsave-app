
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateDonation from './pages/CreateDonation';
import AvailableDonations from './pages/AvailableDonations';
import MyDonations from './pages/MyDonations';
import MerchantRequests from './pages/MerchantRequests';
import AssociationRequests from './pages/AssociationRequests';
import Stats from './pages/Stats';
import TestMatching from './pages/TestMatching'; // ← AJOUTER CETTE LIGNE

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Routes protégées */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/create-donation" element={
              <PrivateRoute>
                <CreateDonation />
              </PrivateRoute>
            } />
            
            <Route path="/available-donations" element={
              <PrivateRoute>
                <AvailableDonations />
              </PrivateRoute>
            } />
            
            <Route path="/my-donations" element={
              <PrivateRoute>
                <MyDonations />
              </PrivateRoute>
            } />
            
            <Route path="/merchant-requests" element={
              <PrivateRoute>
                <MerchantRequests />
              </PrivateRoute>
            } />
            
            <Route path="/association-requests" element={
              <PrivateRoute>
                <AssociationRequests />
              </PrivateRoute>
            } />
            
            {/* Route Statistiques */}
            <Route path="/stats" element={
              <PrivateRoute>
                <Stats />
              </PrivateRoute>
            } />
            
            {/* ROUTE DE TEST (PAS PROTÉGÉE) */}
            <Route path="/test-matching" element={<TestMatching />} />
            
            {/* Redirection par défaut */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
