import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import matchingService from '../services/matchingService';
import userService from '../services/userService';

const MerchantRequests = () => {
  const [requests,           setRequests]           = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [filter,             setFilter]             = useState('all');
  const [error,              setError]              = useState('');
  const [success,            setSuccess]            = useState('');
  const [submitting,         setSubmitting]         = useState(false);
  const [showAcceptModal,    setShowAcceptModal]    = useState(false);
  const [showRejectModal,    setShowRejectModal]    = useState(false);
  const [selectedRequest,    setSelectedRequest]    = useState(null);
  const [suggestions,        setSuggestions]        = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [acceptMessage,      setAcceptMessage]      = useState('');
  const [rejectMessage,      setRejectMessage]      = useState('');

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    const user = userService.getCurrentUser();
    const data = await requestService.getMerchantRequests(user.id);
    setRequests(data);
    setLoading(false);
  };

  const handleAcceptClick = async (request) => {
    setSelectedRequest(request);
    setAcceptMessage('Votre demande a été acceptée !');
    setSuggestions([]);
    setShowAcceptModal(true);
    setSuggestionsLoading(true);
    try {
      const result = await matchingService.getSuggestions(request.donation_id, 5);
      setSuggestions(result?.suggestions || []);
    } catch (err) {
      console.error('Erreur suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleConfirmAccept = async (msg) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await requestService.respondToRequest(
        selectedRequest.id, 'accepted',
        msg || acceptMessage || 'Votre demande a été acceptée.'
      );
      setSuccess('Demande acceptée avec succès !');
      setError('');
      setShowAcceptModal(false);
      loadRequests();
    } catch {
      setError("Erreur lors de l'acceptation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectMessage('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await requestService.respondToRequest(
        selectedRequest.id, 'rejected',
        rejectMessage || 'Votre demande a été refusée.'
      );
      setSuccess('Demande refusée.');
      setError('');
      setShowRejectModal(false);
      loadRequests();
    } catch {
      setError('Erreur lors du refus');
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (s) => s >= 80 ? '#4ade80' : s >= 60 ? '#f59e0b' : '#f87171';

  const statusConfig = {
    pending:  { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.2)' },
    accepted: { label: 'Acceptée',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.2)' },
    rejected: { label: 'Refusée',    color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.2)' },
  };

  const filters      = ['all', 'pending', 'accepted', 'rejected'];
  const filterLabels = { all: 'Toutes', pending: 'En attente', accepted: 'Acceptées', rejected: 'Refusées' };
  const counts       = filters.reduce((acc, f) => {
    acc[f] = f === 'all' ? requests.length : requests.filter(r => r.status === f).length;
    return acc;
  }, {});
  const filtered     = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0b0e14',
      fontFamily: "'DM Sans', sans-serif", color: 'rgba(240,240,240,0.4)',
      fontSize: '0.9rem'
    }}>Chargement…</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .mr-root { min-height:100vh; background:#0b0e14; font-family:'DM Sans',sans-serif; padding:2.5rem 1.5rem 4rem; position:relative; }
        .mr-root::before { content:''; position:fixed; top:-200px; left:-200px; width:600px; height:600px; background:radial-gradient(circle,rgba(74,222,128,0.05) 0%,transparent 70%); pointer-events:none; }
        .mr-inner { max-width:860px; margin:0 auto; position:relative; z-index:1; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{transform:scale(0.95);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse-slow { 0%,100%{opacity:1} 50%{opacity:0.7} }

        .mr-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:2rem; flex-wrap:wrap; gap:1rem; animation:fadeUp 0.4s ease both; }
        .mr-title { font-family:'Syne',sans-serif; font-weight:800; font-size:1.8rem; color:#f0f0f0; letter-spacing:-0.04em; margin:0 0 0.3rem; }
        .mr-subtitle { color:rgba(240,240,240,0.35); font-size:0.875rem; margin:0; }
        .mr-pending-badge { display:inline-flex; align-items:center; gap:0.4rem; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25); border-radius:999px; padding:0.4rem 1rem; font-family:'Syne',sans-serif; font-weight:700; font-size:0.8rem; color:#f59e0b; animation:pulse-slow 2.5s infinite; }

        .mr-alert { border-radius:10px; padding:0.75rem 1rem; font-size:0.85rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:0.5rem; }
        .mr-alert-success { background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.2); color:#86efac; }
        .mr-alert-error   { background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.25); color:#fca5a5; }

        .mr-filters { display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:1.5rem; animation:fadeUp 0.4s 0.05s ease both; }
        .mr-filter-btn { background:none; border:1px solid rgba(255,255,255,0.08); border-radius:999px; padding:0.35rem 0.85rem; font-family:'DM Sans',sans-serif; font-size:0.8rem; font-weight:500; color:rgba(240,240,240,0.4); cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:0.4rem; }
        .mr-filter-btn:hover { color:rgba(240,240,240,0.8); border-color:rgba(255,255,255,0.15); }
        .mr-filter-btn.active { background:rgba(74,222,128,0.1); border-color:rgba(74,222,128,0.3); color:#4ade80; }
        .mr-filter-count { background:rgba(255,255,255,0.08); border-radius:999px; padding:0 0.4rem; font-size:0.72rem; font-family:'Syne',sans-serif; font-weight:700; line-height:1.6; }
        .mr-filter-btn.active .mr-filter-count { background:rgba(74,222,128,0.2); }

        .mr-empty { text-align:center; padding:4rem 2rem; color:rgba(240,240,240,0.25); background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:16px; }
        .mr-empty-icon { font-size:2.5rem; margin-bottom:0.75rem; }
        .mr-empty p { font-size:0.9rem; margin:0; }

        .mr-list { display:flex; flex-direction:column; gap:0.85rem; animation:fadeUp 0.4s 0.1s ease both; }
        .mr-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:1.5rem; transition:border-color 0.18s; }
        .mr-card:hover { border-color:rgba(255,255,255,0.11); }
        .mr-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:0.9rem; }
        .mr-card-assoc { display:flex; align-items:center; gap:0.75rem; }
        .mr-card-avatar { width:40px; height:40px; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; }
        .mr-card-name { font-family:'Syne',sans-serif; font-weight:700; font-size:0.95rem; color:#f0f0f0; margin:0 0 0.15rem; }
        .mr-card-date { font-size:0.75rem; color:rgba(240,240,240,0.3); margin:0; }
        .mr-status-pill { display:inline-flex; align-items:center; gap:0.35rem; border-radius:999px; padding:0.25rem 0.75rem; font-size:0.73rem; font-weight:700; font-family:'Syne',sans-serif; flex-shrink:0; background:var(--pill-bg); color:var(--pill-color); border:1px solid var(--pill-border); }
        .mr-status-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
        .mr-message { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.85rem 1rem; font-size:0.875rem; color:rgba(240,240,240,0.6); line-height:1.5; margin-bottom:1rem; font-style:italic; }
        .mr-response-box { background:rgba(74,222,128,0.04); border:1px solid rgba(74,222,128,0.12); border-radius:10px; padding:0.85rem 1rem; margin-bottom:1rem; }
        .mr-response-box.rejected { background:rgba(248,113,113,0.04); border-color:rgba(248,113,113,0.12); }
        .mr-response-label { font-size:0.72rem; font-weight:600; font-family:'Syne',sans-serif; text-transform:uppercase; letter-spacing:0.06em; color:rgba(240,240,240,0.3); margin-bottom:0.3rem; }
        .mr-response-text { font-size:0.875rem; color:rgba(240,240,240,0.6); margin:0 0 0.25rem; }
        .mr-response-date { font-size:0.73rem; color:rgba(240,240,240,0.25); }
        .mr-actions { display:flex; gap:0.6rem; }
        .mr-btn { display:inline-flex; align-items:center; gap:0.4rem; border:none; border-radius:10px; padding:0.55rem 1.1rem; font-family:'Syne',sans-serif; font-weight:700; font-size:0.82rem; cursor:pointer; transition:all 0.15s; }
        .mr-btn-accept { background:rgba(74,222,128,0.12); border:1px solid rgba(74,222,128,0.25); color:#4ade80; }
        .mr-btn-accept:hover { background:#4ade80; color:#0b0e14; transform:translateY(-1px); }
        .mr-btn-reject { background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.2); color:#f87171; }
        .mr-btn-reject:hover { background:#f87171; color:#fff; transform:translateY(-1px); }

        /* Modals */
        .mr-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.2s ease; }
        .mr-modal { background:#151820; border:1px solid rgba(255,255,255,0.1); border-radius:18px; width:100%; max-width:580px; max-height:85vh; overflow-y:auto; padding:2rem; animation:scaleIn 0.2s ease; }
        .mr-modal.narrow { max-width:460px; }
        .mr-modal::-webkit-scrollbar { width:4px; }
        .mr-modal::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:999px; }
        .mr-modal-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; }
        .mr-modal-title { font-family:'Syne',sans-serif; font-weight:800; font-size:1.2rem; color:#f0f0f0; letter-spacing:-0.02em; margin:0 0 0.3rem; }
        .mr-modal-sub { color:rgba(240,240,240,0.4); font-size:0.85rem; margin:0; }
        .mr-modal-x { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:8px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:rgba(240,240,240,0.4); font-size:0.9rem; transition:all 0.15s; flex-shrink:0; }
        .mr-modal-x:hover { color:#f0f0f0; background:rgba(255,255,255,0.1); }
        .mr-divider { height:1px; background:rgba(255,255,255,0.07); margin:1rem 0; }
        .mr-modal-label { display:block; font-size:0.75rem; font-weight:500; color:rgba(240,240,240,0.4); text-transform:uppercase; letter-spacing:0.04em; margin:0.5rem 0 0.4rem; }
        .mr-modal-textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.7rem 0.9rem; color:#f0f0f0; font-family:'DM Sans',sans-serif; font-size:0.9rem; outline:none; resize:vertical; min-height:80px; transition:border-color 0.2s; box-sizing:border-box; margin-bottom:1rem; }
        .mr-modal-textarea::placeholder { color:rgba(240,240,240,0.2); }
        .mr-modal-textarea:focus { border-color:rgba(74,222,128,0.4); }
        .mr-modal-footer { display:flex; gap:0.6rem; justify-content:flex-end; }
        .mr-modal-cancel { background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.6rem 1.2rem; color:rgba(240,240,240,0.45); font-family:'DM Sans',sans-serif; font-size:0.875rem; cursor:pointer; transition:all 0.15s; }
        .mr-modal-cancel:hover { color:#f0f0f0; border-color:rgba(255,255,255,0.2); }
        .mr-modal-confirm { border:none; border-radius:10px; padding:0.65rem 1.4rem; font-family:'Syne',sans-serif; font-weight:700; font-size:0.875rem; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:0.4rem; }
        .mr-modal-confirm.accept { background:#4ade80; color:#0b0e14; }
        .mr-modal-confirm.accept:hover:not(:disabled) { background:#6ee7a0; }
        .mr-modal-confirm.reject { background:#f87171; color:#fff; }
        .mr-modal-confirm.reject:hover:not(:disabled) { background:#fca5a5; color:#0b0e14; }
        .mr-modal-confirm:disabled { opacity:0.5; cursor:not-allowed; }

        /* Suggestions */
        .suggestions-loading { text-align:center; padding:2rem; color:rgba(240,240,240,0.35); font-size:0.875rem; }
        .suggestions-empty { text-align:center; padding:1.25rem; color:rgba(240,240,240,0.25); font-size:0.83rem; background:rgba(255,255,255,0.02); border-radius:10px; margin-bottom:1rem; }
        .suggestion-item { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.2rem; margin-bottom:0.75rem; transition:all 0.18s; }
        .suggestion-item:hover { border-color:rgba(74,222,128,0.25); transform:translateX(3px); }
        .suggestion-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
        .suggestion-name { font-family:'Syne',sans-serif; font-weight:700; font-size:0.9rem; color:#f0f0f0; }
        .suggestion-score { font-family:'Syne',sans-serif; font-weight:800; font-size:1.1rem; background:rgba(0,0,0,0.3); border-radius:8px; padding:0.15rem 0.6rem; }
        .suggestion-badge { display:inline-block; font-size:0.68rem; font-family:'Syne',sans-serif; font-weight:700; padding:0.15rem 0.5rem; border-radius:999px; margin-bottom:0.45rem; text-transform:uppercase; letter-spacing:0.04em; }
        .suggestion-reasons { display:flex; flex-direction:column; gap:0.25rem; margin-bottom:0.6rem; }
.suggestion-reason { font-size:0.75rem; padding:0.25rem 0.6rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07); border-radius:6px; color:rgba(240,240,240,0.6); display:block; }
        .suggestion-dist { font-size:0.73rem; color:rgba(240,240,240,0.28); margin-bottom:0.65rem; }
        .suggestion-btn { width:100%; background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.2); color:#4ade80; padding:0.5rem; border-radius:8px; cursor:pointer; font-family:'Syne',sans-serif; font-weight:700; font-size:0.78rem; transition:all 0.15s; }
        .suggestion-btn:hover { background:#4ade80; color:#0b0e14; }

        .mr-spinner { width:14px; height:14px; border:2px solid rgba(0,0,0,0.2); border-top-color:currentColor; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
        .spinner-green { border-top-color:#4ade80; margin:0 auto 0.75rem; }
      `}</style>

      <div className="mr-root">
        <div className="mr-inner">

          <div className="mr-header">
            <div>
              <h1 className="mr-title">Demandes reçues</h1>
              <p className="mr-subtitle">{requests.length} demande{requests.length !== 1 ? 's' : ''} au total</p>
            </div>
            {pendingCount > 0 && <div className="mr-pending-badge">⏳ {pendingCount} en attente</div>}
          </div>

          {success && <div className="mr-alert mr-alert-success">✅ {success}</div>}
          {error   && <div className="mr-alert mr-alert-error">⚠️ {error}</div>}

          <div className="mr-filters">
            {filters.map(f => (
              <button key={f} className={`mr-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {filterLabels[f]}<span className="mr-filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="mr-empty"><div className="mr-empty-icon">📭</div><p>Aucune demande dans cette catégorie.</p></div>
          ) : (
            <div className="mr-list">
              {filtered.map(request => {
                const sc = statusConfig[request.status] || statusConfig.pending;
                return (
                  <div className="mr-card" key={request.id}>
                    <div className="mr-card-top">
                      <div className="mr-card-assoc">
                        <div className="mr-card-avatar">🤝</div>
                        <div>
                          <p className="mr-card-name">{request.association_name}</p>
                          <p className="mr-card-date">Reçue le {new Date(request.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                      <span className="mr-status-pill" style={{'--pill-bg':sc.bg,'--pill-color':sc.color,'--pill-border':sc.border}}>
                        <span className="mr-status-dot" /> {sc.label}
                      </span>
                    </div>

                    <div className="mr-message">"{request.message}"</div>

                    {request.status !== 'pending' && request.response_message && (
                      <div className={`mr-response-box ${request.status === 'rejected' ? 'rejected' : ''}`}>
                        <div className="mr-response-label">Votre réponse</div>
                        <p className="mr-response-text">{request.response_message}</p>
                        <div className="mr-response-date">Le {new Date(request.responded_at).toLocaleString('fr-FR')}</div>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="mr-actions">
                        <button className="mr-btn mr-btn-accept" onClick={() => handleAcceptClick(request)}>✅ Accepter</button>
                        <button className="mr-btn mr-btn-reject" onClick={() => handleRejectClick(request)}>❌ Refuser</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ACCEPTATION + SUGGESTIONS ── */}
      {showAcceptModal && selectedRequest && (
        <div className="mr-overlay" onClick={(e) => e.target === e.currentTarget && setShowAcceptModal(false)}>
          <div className="mr-modal">
            <div className="mr-modal-head">
              <div>
                <h2 className="mr-modal-title">🎯 Associations recommandées</h2>
                <p className="mr-modal-sub">Demande de <strong style={{color:'#f0f0f0'}}>{selectedRequest.association_name}</strong></p>
              </div>
              <button className="mr-modal-x" onClick={() => setShowAcceptModal(false)}>✕</button>
            </div>

            {suggestionsLoading ? (
              <div className="suggestions-loading">
                <div className="mr-spinner spinner-green" />
                Analyse des associations en cours…
              </div>
            ) : suggestions.length === 0 ? (
              <div className="suggestions-empty">📭 Aucune suggestion disponible — acceptez directement.</div>
            ) : (
              suggestions.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <div className="suggestion-head">
                    <span className="suggestion-name">{s.association_name}</span>
                    <span className="suggestion-score" style={{color: getScoreColor(s.score)}}>{s.score}%</span>
                  </div>
                  <span className="suggestion-badge" style={{
                    background:`rgba(${s.score>=80?'74,222,128':s.score>=60?'245,158,11':'248,113,113'},0.12)`,
                    color: getScoreColor(s.score)
                  }}>{s.compatibility}</span>
                  <div className="suggestion-reasons">
                    {s.reasons?.map((r, j) => <span key={j} className="suggestion-reason">{r}</span>)}
                  </div>
                  <div className="suggestion-dist">📍 {s.estimated_distance} km estimé</div>
                  <button className="suggestion-btn" onClick={() => handleConfirmAccept(`Demande acceptée — compatibilité : ${s.compatibility} (${s.score}%)`)}>
                    Accepter avec ce score ({s.score}%)
                  </button>
                </div>
              ))
            )}

            <div className="mr-divider" />
            <label className="mr-modal-label">Message à l'association</label>
            <textarea
              className="mr-modal-textarea"
              value={acceptMessage}
              onChange={(e) => setAcceptMessage(e.target.value)}
              placeholder="Indiquez la date et l'heure de retrait…"
            />
            <div className="mr-modal-footer">
              <button className="mr-modal-cancel" onClick={() => setShowAcceptModal(false)}>Annuler</button>
              <button className="mr-modal-confirm accept" onClick={() => handleConfirmAccept(acceptMessage)} disabled={submitting}>
                {submitting ? <><span className="mr-spinner" /> En cours…</> : '✅ Accepter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL REFUS ── */}
      {showRejectModal && selectedRequest && (
        <div className="mr-overlay" onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}>
          <div className="mr-modal narrow">
            <div className="mr-modal-head">
              <div>
                <h2 className="mr-modal-title">❌ Refuser la demande</h2>
                <p className="mr-modal-sub">Demande de <strong style={{color:'#f0f0f0'}}>{selectedRequest.association_name}</strong></p>
              </div>
              <button className="mr-modal-x" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <label className="mr-modal-label">Raison du refus</label>
            <textarea
              className="mr-modal-textarea"
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              placeholder="Expliquez pourquoi vous refusez cette demande…"
            />
            <div className="mr-modal-footer">
              <button className="mr-modal-cancel" onClick={() => setShowRejectModal(false)}>Annuler</button>
              <button className="mr-modal-confirm reject" onClick={handleConfirmReject} disabled={submitting}>
                {submitting ? <><span className="mr-spinner" /> En cours…</> : '❌ Refuser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MerchantRequests;