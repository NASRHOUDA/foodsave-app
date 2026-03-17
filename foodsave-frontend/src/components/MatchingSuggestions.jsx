
import React, { useState, useEffect } from 'react';
import matchingService from '../services/matchingService';
import userService from '../services/userService';

const MatchingSuggestions = ({ donationId, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (donationId) {
      loadSuggestions();
    }
  }, [donationId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les associations avec leurs vraies données
      const associations = await userService.getAssociations();
      console.log('Associations récupérées:', associations);
      
      // Formater pour le matching service avec les vraies données
      const assocData = associations.map(a => ({
        id: a.id,
        name: a.name,
        capacity: a.capacity || 100,                 // ✅ Vraie capacité
        lat: a.lat || 48.8566,                       // ✅ Vraie latitude
        lon: a.lon || 2.3522,                         // ✅ Vraie longitude
        preferred_food_types: a.preferred_food_types || [] // ✅ Préférences
      }));

      console.log('Données envoyées au matching:', assocData);

      // Appeler le matching batch
      const result = await matchingService.matchBatch(donationId, assocData);
      console.log('Résultat du matching:', result);
      
      setSuggestions(result?.matches || []);
    } catch (err) {
      setError('Erreur chargement suggestions');
      console.error('Erreur détaillée:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#f59e0b';
    return '#f87171';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'excellente';
    if (score >= 60) return 'bonne';
    if (score >= 40) return 'moyenne';
    return 'faible';
  };

  if (loading) return (
    <div className="text-center py-4" style={{ color: 'rgba(240,240,240,0.5)' }}>
      <div className="spinner-border spinner-border-sm me-2" role="status" />
      Calcul des meilleures associations...
    </div>
  );

  return (
    <div className="matching-suggestions">
      <style>{`
        .matching-suggestions {
          margin-top: 1rem;
        }

        .suggestion-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          transition: all 0.2s;
        }

        .suggestion-card:hover {
          transform: translateX(4px);
          border-color: rgba(74,222,128,0.3);
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .suggestion-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: #f0f0f0;
        }

        .suggestion-score {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.2rem;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: rgba(0,0,0,0.3);
        }

        .suggestion-reasons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .suggestion-reason {
          font-size: 0.75rem;
          padding: 0.2rem 0.6rem;
          background: rgba(255,255,255,0.05);
          border-radius: 999px;
          color: rgba(240,240,240,0.6);
        }

        .suggestion-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-size: 0.8rem;
        }

        .suggestion-distance {
          color: rgba(240,240,240,0.4);
        }

        .suggestion-compatibility {
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .compatibility-excellente { background: rgba(74,222,128,0.15); color: #4ade80; }
        .compatibility-bonne { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .compatibility-moyenne { background: rgba(96,165,250,0.15); color: #60a5fa; }
        .compatibility-faible { background: rgba(248,113,113,0.15); color: #f87171; }

        .select-button {
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          color: #4ade80;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .select-button:hover {
          background: #4ade80;
          color: #0b0e14;
          border-color: #4ade80;
        }

        .suggestion-empty {
          text-align: center;
          padding: 2rem;
          color: rgba(240,240,240,0.3);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 12px;
        }

        .suggestion-error {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          color: #f87171;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }
      `}</style>

      <h4 style={{ 
        fontFamily: "'Syne', sans-serif", 
        fontSize: '1rem', 
        color: '#f0f0f0',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>🎯</span> Associations recommandées
      </h4>

      {error && <div className="suggestion-error">⚠️ {error}</div>}

      {suggestions.length === 0 ? (
        <div className="suggestion-empty">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
          <p>Aucune suggestion disponible</p>
          <p style={{ fontSize: '0.75rem' }}>Essayez avec un autre don</p>
        </div>
      ) : (
        suggestions.map((s, index) => {
          const compatibilityClass = `compatibility-${s.compatibility}`;
          return (
            <div key={index} className="suggestion-card">
              <div className="suggestion-header">
                <span className="suggestion-name">{s.association_name}</span>
                <span 
                  className="suggestion-score"
                  style={{ color: getScoreColor(s.score) }}
                >
                  {Math.round(s.score)}%
                </span>
              </div>

              <div className="suggestion-reasons">
                {s.reasons?.map((reason, i) => (
                  <span key={i} className="suggestion-reason">{reason}</span>
                ))}
              </div>

              <div className="suggestion-details">
                <span className="suggestion-distance">
                  📍 {s.estimated_distance?.toFixed(1)} km
                </span>
                <span className={`suggestion-compatibility ${compatibilityClass}`}>
                  {s.compatibility}
                </span>
              </div>

              <button 
                className="select-button"
                onClick={() => onSelect?.(s.association_id, s.score)}
              >
                Accepter avec cette association (score: {Math.round(s.score)}%)
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MatchingSuggestions;
