import React, { useState, useEffect } from 'react';
import MatchingSuggestions from '../components/MatchingSuggestions';
import donationService from '../services/donationService';

const TestMatching = () => {
  const [selectedAssoc, setSelectedAssoc] = useState(null);
  const [donationId, setDonationId] = useState('');
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les vrais dons depuis la base
  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      const allDonations = await donationService.getAllDonations();
      // Filtrer les dons disponibles
      const availableDonations = allDonations.filter(d => d.status === 'available');
      setDonations(availableDonations);
      if (availableDonations.length > 0) {
        setDonationId(availableDonations[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement dons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      background: '#0b0e14',
      minHeight: '100vh',
      color: 'rgba(240,240,240,0.5)'
    }}>
      Chargement des dons...
    </div>
  );

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: '#0b0e14',
      minHeight: '100vh',
      color: '#f0f0f0'
    }}>
      <h1 style={{ 
        fontFamily: "'Syne', sans-serif",
        fontSize: '1.8rem',
        marginBottom: '1.5rem',
        color: '#f0f0f0'
      }}>
        🎯 Test du Matching Service
      </h1>

      {donations.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.07)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p style={{ color: 'rgba(240,240,240,0.5)' }}>
            Aucun don disponible pour le moment.
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'rgba(240,240,240,0.6)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              📦 Sélectionner un don :
            </label>
            <select 
              value={donationId}
              onChange={(e) => setDonationId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#f0f0f0',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {donations.map(d => (
                <option key={d.id} value={d.id} style={{ background: '#1a1f2b' }}>
                  {d.description} - {d.quantity}kg ({d.food_type})
                </option>
              ))}
            </select>
          </div>

          {donationId && (
            <MatchingSuggestions 
              donationId={donationId}
              onSelect={(assocId, score) => {
                setSelectedAssoc({assocId, score});
                console.log('✅ Association sélectionnée:', assocId, score);
              }}
            />
          )}

          {selectedAssoc && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem',
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: '8px',
              color: '#4ade80'
            }}>
              ✅ Association sélectionnée : ID {selectedAssoc.assocId} (score: {selectedAssoc.score}%)
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestMatching;
