import React, { useEffect, useState } from 'react';

export default function AIInsights({ activeProfile }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProfile) return;
    setLoading(true);
    fetch(`/api/ai/insights/${activeProfile.id}`)
      .then(r => r.json())
      .then(data => {
        setInsights(data);
      })
      .catch(err => console.error('Failed to load AI insights', err))
      .finally(() => setLoading(false));
  }, [activeProfile]);

  if (loading) return <div className="glass-card">Loading AI Insights...</div>;
  if (!insights) return <div className="glass-card">No insights available.</div>;

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <h2>AI Insights for {insights.profile.name}</h2>

      <section style={{ marginTop: 12 }}>
        <strong>Recent Missions</strong>
        <ul>
          {(insights.profile.missions || []).slice(-6).map(m => (
            <li key={m.id}><strong>{m.title}</strong> — {m.description} ({m.targetSkill})</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 12 }}>
        <strong>Recent Session Analyses</strong>
        {insights.recentAnalyses.length === 0 && <div>No recent analyses yet.</div>}
        {insights.recentAnalyses.map(a => (
          <div key={a.sessionId} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, marginTop: 8 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(a.startTime).toLocaleString()}</div>
            {a.analysis ? (
              <div>
                <div><strong>Strengths:</strong> {a.analysis.strengths.join(', ')}</div>
                <div><strong>Weaknesses:</strong> {a.analysis.weaknesses.join(', ')}</div>
                <div><strong>Recommended Goals:</strong> {a.analysis.recommendedGoals.join(', ')}</div>
              </div>
            ) : (
              <div>No analysis recorded for this session.</div>
            )}
          </div>
        ))}
      </section>

      <section style={{ marginTop: 12 }}>
        <strong>Quick Actions</strong>
        <div style={{ marginTop: 8 }}>
          <button className="btn-primary" onClick={() => window.location.reload()}>Refresh Insights</button>
        </div>
      </section>
    </div>
  );
}
