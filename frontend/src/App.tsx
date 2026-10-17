import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ingestion' | 'risk' | 'diagnostics' | 'recommendations'>('ingestion');
  const [observations, setObservations] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  // Form states
  const [obsForm, setObsForm] = useState({
    obs_id: 'OBS-' + Math.floor(Math.random() * 10000),
    timestamp: new Date().toISOString(),
    location: 'Central Agricultural Zone 4',
    category: 'Crop Pathology',
    incidence_rate: 6.8,
    mortality_count: 22,
    soil_moisture: 42.5,
    data_source: 'Sentinel Satellite & IoT Grid',
    quality_indicator: 'High Integrity'
  });

  const [riskForm, setRiskForm] = useState({
    incident_code: 'INC-2026-001',
    title: 'Synthetic Rust Anomaly - Sector 4',
    domain: 'Phytosanitary',
    bio_evidence_score: 8.5,
    cyber_evidence_score: 7.2,
    supply_evidence_score: 6.0,
    data_quality_modifier: 1.0
  });

  const [diagForm, setDiagForm] = useState({
    sample_id: 'SMP-' + Math.floor(Math.random() * 10000),
    incident_code: 'INC-2026-001',
    collection_date: new Date().toISOString().split('T')[0],
    receiving_lab: 'National Bio-Forensic Lab (BSL-3)',
    test_method: 'CRISPR-Cas Multiplex PCR & NGS',
    result_status: 'Positive - Marker Identified',
    verification_date: new Date().toISOString().split('T')[0],
    authorized_reviewer: 'Dr. Sarah Al-Mansoor',
    reference_note: 'Genomic profile matches engineered resistance cluster.'
  });

  const [recForm, setRecForm] = useState({
    incident_code: 'INC-2026-001',
    action_title: 'Establish 10km Quarantine Perimeter',
    rationale: 'High spore dispersal velocity detected via automated anomaly baseline.',
    responsible_role: 'State Department of Agriculture & Emergency Response',
    priority: 'Critical / Immediate (0-12 hrs)',
    review_status: 'Pending Authorization'
  });

  const fetchData = async () => {
    try {
      const [obsRes, incRes, diagRes, recRes] = await Promise.all([
        axios.get(`${API_URL}/api/observations`),
        axios.get(`${API_URL}/api/incidents`),
        axios.get(`${API_URL}/api/diagnostics`),
        axios.get(`${API_URL}/api/recommendations`)
      ]);
      setObservations(obsRes.data);
      setIncidents(incRes.data);
      setDiagnostics(diagRes.data);
      setRecommendations(recRes.data);
    } catch (err) {
      console.error('Error fetching data from backend:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/observations/ingest`, obsForm);
      setStatusMessage(`Observation Ingested Successfully. Anomaly Detected: ${res.data.is_anomaly} (Score: ${res.data.anomaly_score})`);
      fetchData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.detail || 'Failed to ingest'}`);
    }
  };

  const handleRiskEval = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/risk/evaluate`, riskForm);
      setStatusMessage(`Risk Evaluated: Code ${res.data.incident_code} | Score: ${res.data.risk_score} (${res.data.risk_category})`);
      fetchData();
    } catch (err: any) {
      setStatusMessage(`Error evaluating risk.`);
    }
  };

  const handleDiagAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/diagnostics`, diagForm);
      setStatusMessage(`Diagnostic verification record logged.`);
      fetchData();
    } catch (err) {
      setStatusMessage(`Error adding diagnostic.`);
    }
  };

  const handleRecAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/recommendations`, recForm);
      setStatusMessage(`Mitigation action framework updated.`);
      fetchData();
    } catch (err) {
      setStatusMessage(`Error adding recommendation.`);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>Integrated Agro-Biosecurity Decision Engine (IADE)</h1>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
          One Health Decision Support & Synthetic Biology Threat Mitigation Platform
        </p>
      </header>

      {statusMessage && (
        <div style={{ backgroundColor: '#1e293b', borderLeft: '4px solid #38bdf8', padding: '10px 15px', marginBottom: '20px', borderRadius: '4px' }}>
          <strong>Status:</strong> {statusMessage}
        </div>
      )}

      <nav style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('ingestion')} style={tabStyle(activeTab === 'ingestion')}>
          Module 1: Anomaly Ingestion
        </button>
        <button onClick={() => setActiveTab('risk')} style={tabStyle(activeTab === 'risk')}>
          Module 2: AI Triage & Risk
        </button>
        <button onClick={() => setActiveTab('diagnostics')} style={tabStyle(activeTab === 'diagnostics')}>
          Laboratory Verification
        </button>
        <button onClick={() => setActiveTab('recommendations')} style={tabStyle(activeTab === 'recommendations')}>
          Module 3: Action Framework
        </button>
      </nav>

      <main style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
        {activeTab === 'ingestion' && (
          <div>
            <h2>Automated Data Ingestion & Baseline Deviation</h2>
            <form onSubmit={handleIngest} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
              <div>
                <label>Observation ID:</label>
                <input type="text" value={obsForm.obs_id} onChange={e => setObsForm({...obsForm, obs_id: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Location / Sector:</label>
                <input type="text" value={obsForm.location} onChange={e => setObsForm({...obsForm, location: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Category:</label>
                <input type="text" value={obsForm.category} onChange={e => setObsForm({...obsForm, category: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Incidence Rate (per 100ha):</label>
                <input type="number" step="0.1" value={obsForm.incidence_rate} onChange={e => setObsForm({...obsForm, incidence_rate: parseFloat(e.target.value)})} style={inputStyle} />
              </div>
              <div>
                <label>Mortality Count:</label>
                <input type="number" value={obsForm.mortality_count} onChange={e => setObsForm({...obsForm, mortality_count: parseInt(e.target.value)})} style={inputStyle} />
              </div>
              <div>
                <label>Soil Moisture (%):</label>
                <input type="number" step="0.1" value={obsForm.soil_moisture} onChange={e => setObsForm({...obsForm, soil_moisture: parseFloat(e.target.value)})} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" style={buttonStyle}>Submit & Run Baseline Deviation Analysis</button>
              </div>
            </form>

            <h3>Recent Telemetry & Anomaly Log</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', textAlign: 'left' }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Rate</th>
                  <th style={thStyle}>Mortality</th>
                  <th style={thStyle}>Anomaly?</th>
                  <th style={thStyle}>Score</th>
                  <th style={thStyle}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={tdStyle}>{item.obs_id}</td>
                    <td style={tdStyle}>{item.location}</td>
                    <td style={tdStyle}>{item.incidence_rate}</td>
                    <td style={tdStyle}>{item.mortality_count}</td>
                    <td style={{ ...tdStyle, color: item.is_anomaly ? '#f87171' : '#4ade80' }}>
                      {item.is_anomaly ? 'ANOMALY' : 'Normal'}
                    </td>
                    <td style={tdStyle}>{item.anomaly_score}</td>
                    <td style={tdStyle}>{item.anomaly_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'risk' && (
          <div>
            <h2>AI Triage & Multiplex Risk Engine</h2>
            <form onSubmit={handleRiskEval} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
              <div>
                <label>Incident Code:</label>
                <input type="text" value={riskForm.incident_code} onChange={e => setRiskForm({...riskForm, incident_code: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Incident Title:</label>
                <input type="text" value={riskForm.title} onChange={e => setRiskForm({...riskForm, title: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Biological Evidence Score (0-10):</label>
                <input type="number" step="0.1" value={riskForm.bio_evidence_score} onChange={e => setRiskForm({...riskForm, bio_evidence_score: parseFloat(e.target.value)})} style={inputStyle} />
              </div>
              <div>
                <label>Cyber/Supply Vector Score (0-10):</label>
                <input type="number" step="0.1" value={riskForm.cyber_evidence_score} onChange={e => setRiskForm({...riskForm, cyber_evidence_score: parseFloat(e.target.value)})} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" style={buttonStyle}>Run Multi-Factor Risk Assessment</button>
              </div>
            </form>

            <h3>Active Incident Queue</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', textAlign: 'left' }}>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Domain</th>
                  <th style={thStyle}>Risk Score</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={tdStyle}>{inc.incident_code}</td>
                    <td style={tdStyle}>{inc.title}</td>
                    <td style={tdStyle}>{inc.domain}</td>
                    <td style={tdStyle}><strong>{inc.risk_score}</strong></td>
                    <td style={{ ...tdStyle, color: '#f59e0b' }}>{inc.risk_category}</td>
                    <td style={tdStyle}>{inc.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div>
            <h2>Laboratory Verification & BSL-3 Forensics</h2>
            <form onSubmit={handleDiagAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
              <div>
                <label>Sample ID:</label>
                <input type="text" value={diagForm.sample_id} onChange={e => setDiagForm({...diagForm, sample_id: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Incident Code:</label>
                <input type="text" value={diagForm.incident_code} onChange={e => setDiagForm({...diagForm, incident_code: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Receiving Lab:</label>
                <input type="text" value={diagForm.receiving_lab} onChange={e => setDiagForm({...diagForm, receiving_lab: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Test Method:</label>
                <input type="text" value={diagForm.test_method} onChange={e => setDiagForm({...diagForm, test_method: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" style={buttonStyle}>Record Verification Result</button>
              </div>
            </form>

            <h3>Diagnostic Records</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', textAlign: 'left' }}>
                  <th style={thStyle}>Sample ID</th>
                  <th style={thStyle}>Incident</th>
                  <th style={thStyle}>Lab</th>
                  <th style={thStyle}>Method</th>
                  <th style={thStyle}>Result</th>
                  <th style={thStyle}>Reviewer</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={tdStyle}>{d.sample_id}</td>
                    <td style={tdStyle}>{d.incident_code}</td>
                    <td style={tdStyle}>{d.receiving_lab}</td>
                    <td style={tdStyle}>{d.test_method}</td>
                    <td style={{ ...tdStyle, color: '#38bdf8' }}>{d.result_status}</td>
                    <td style={tdStyle}>{d.authorized_reviewer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            <h2>Action & Mitigation Output Framework (72-Hour Response)</h2>
            <form onSubmit={handleRecAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
              <div>
                <label>Incident Code:</label>
                <input type="text" value={recForm.incident_code} onChange={e => setRecForm({...recForm, incident_code: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Action Title:</label>
                <input type="text" value={recForm.action_title} onChange={e => setRecForm({...recForm, action_title: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Responsible Role:</label>
                <input type="text" value={recForm.responsible_role} onChange={e => setRecForm({...recForm, responsible_role: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label>Priority:</label>
                <input type="text" value={recForm.priority} onChange={e => setRecForm({...recForm, priority: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Rationale:</label>
                <textarea value={recForm.rationale} onChange={e => setRecForm({...recForm, rationale: e.target.value})} style={{ ...inputStyle, height: '60px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" style={buttonStyle}>Generate Operational Directive</button>
              </div>
            </form>

            <h3>Active Directives & Mitigation Steps</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', textAlign: 'left' }}>
                  <th style={thStyle}>Incident</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Responsible Role</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={tdStyle}>{r.incident_code}</td>
                    <td style={tdStyle}><strong>{r.action_title}</strong></td>
                    <td style={tdStyle}>{r.responsible_role}</td>
                    <td style={{ ...tdStyle, color: '#f87171' }}>{r.priority}</td>
                    <td style={tdStyle}>{r.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const tabStyle = (active: boolean) => ({
  backgroundColor: active ? '#38bdf8' : '#334155',
  color: active ? '#0f172a' : '#f8fafc',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold' as 'bold'
});

const inputStyle = {
  width: '100%',
  padding: '8px',
  marginTop: '5px',
  backgroundColor: '#0f172a',
  border: '1px solid #475569',
  borderRadius: '4px',
  color: '#f8fafc'
};

const buttonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold' as 'bold'
};

const thStyle = { padding: '12px', borderBottom: '2px solid #475569' };
const tdStyle = { padding: '10px' };