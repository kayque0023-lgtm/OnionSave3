import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bugsAPI, projectsAPI, sprintsAPI, uploadsAPI } from '../services/api';
import { Bug, Plus, X, UploadCloud, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BugsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ project_id: '', sprint_id: '', description: '' });
  const [sprints, setSprints] = useState([]);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    
    // Check if redirected from another page to create bug
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      const pid = params.get('projectId');
      const sid = params.get('sprintId');
      setFormData({ project_id: pid || '', sprint_id: sid || '', description: '' });
      setIsModalOpen(true);
      if (pid) loadSprintsForProject(pid);
    }
  }, [location.search]);

  useEffect(() => {
    loadBugs();
  }, [selectedProjectId]);

  const loadData = async () => {
    try {
      const projRes = await projectsAPI.list();
      setProjects(projRes.data.projects || []);
      await loadBugs();
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBugs = async () => {
    try {
      const res = await bugsAPI.list(selectedProjectId || undefined);
      setBugs(res.data.bugs || []);
    } catch (err) {
      console.error('Erro ao carregar bugs:', err);
    }
  };

  const loadSprintsForProject = async (projectId) => {
    try {
      const res = await projectsAPI.get(projectId);
      setSprints(res.data.sprints || []);
    } catch (err) {
      console.error('Erro ao carregar sprints:', err);
    }
  };

  const handleProjectChange = (e) => {
    const pid = e.target.value;
    setFormData({ ...formData, project_id: pid, sprint_id: '' });
    if (pid) loadSprintsForProject(pid);
    else setSprints([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project_id || !formData.sprint_id || !formData.description) {
      return alert('Preencha todos os campos obrigatórios.');
    }

    setIsSubmitting(true);
    try {
      let evidence_url = null;
      if (evidenceFile) {
        const uploadRes = await uploadsAPI.uploadEvidence(evidenceFile);
        evidence_url = uploadRes.data.url;
      }

      await bugsAPI.create({ ...formData, evidence_url });
      
      setIsModalOpen(false);
      setFormData({ project_id: '', sprint_id: '', description: '' });
      setEvidenceFile(null);
      loadBugs();
      
      // Clean up URL if came from redirect
      if (location.search) navigate('/bugs', { replace: true });
    } catch (err) {
      alert('Erro ao registrar bug');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chart Data preparation
  const chartData = useMemo(() => {
    const counts = {};
    bugs.forEach(b => {
      const key = selectedProjectId ? b.sprint_name : b.project_name;
      counts[key] = (counts[key] || 0) + 1;
    });

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: 'Quantidade de Bugs',
          data: Object.values(counts),
          backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
          borderColor: 'rgb(220, 38, 38)',
          borderWidth: 1,
          maxBarThickness: 60,
        },
      ],
    };
  }, [bugs, selectedProjectId]);

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
      x: {
        from: 500 // Inicia as barras mais à direita para dar o efeito de "jogadas para a esquerda"
      }
    },
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true, 
        text: selectedProjectId ? 'Bugs por Test Case' : 'Bugs por Projeto',
        color: 'var(--text-primary)'
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: 'var(--text-secondary)' },
        grid: { color: 'var(--border)' }
      },
      y: {
        ticks: { color: 'var(--text-secondary)' },
        grid: { display: false }
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bug size={28} /> Central de Bugs
          </h1>
          <p className="page-subtitle">Acompanhe e registre defeitos encontrados nos test cases</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Registrar Bug
        </button>
      </div>

      {/* Filtro e Gráfico */}
      <div className="dashboard-grid mb-2" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none', paddingBottom: 0 }}>
            <h2 className="card-title">Visão Geral</h2>
            <select 
              className="form-select" 
              style={{ width: '250px' }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Todos os Projetos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ height: '300px', padding: '1rem' }}>
            {bugs.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="empty-state" style={{ height: '100%' }}>Nenhum bug registrado no contexto atual.</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Bugs */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Bugs Registrados ({bugs.length})</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {bugs.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Série</th>
                  <th style={{ padding: '1rem' }}>Projeto</th>
                  <th style={{ padding: '1rem' }}>Test Case</th>
                  <th style={{ padding: '1rem' }}>Descrição</th>
                  <th style={{ padding: '1rem' }}>Evidência</th>
                  <th style={{ padding: '1rem' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {bugs.map(bug => (
                  <tr key={bug.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--danger)' }}>
                      {bug.serial_number}
                    </td>
                    <td style={{ padding: '1rem' }}>{bug.project_name}</td>
                    <td style={{ padding: '1rem' }}>{bug.sprint_name}</td>
                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={bug.description}>
                        {bug.description}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {bug.evidence_url ? (
                        <a 
                          href={`http://localhost:8000${bug.evidence_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <ImageIcon size={14} /> Ver Imagem
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sem evidência</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {formatDate(bug.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <Bug size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
              <p className="empty-state-title">Nenhum bug encontrado</p>
              <p className="empty-state-text">O sistema está limpo por aqui.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Registro de Bug */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Registrar Novo Bug</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => {
                setIsModalOpen(false);
                if (location.search) navigate('/bugs', { replace: true });
              }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Projeto afetado *</label>
                <select 
                  className="form-select" 
                  required
                  value={formData.project_id}
                  onChange={handleProjectChange}
                >
                  <option value="" disabled>Selecione o projeto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {formData.project_id && (
                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Test Case *</label>
                  <select 
                    className="form-select" 
                    required
                    value={formData.sprint_id}
                    onChange={(e) => setFormData({...formData, sprint_id: e.target.value})}
                  >
                    <option value="" disabled>Selecione o test case onde o bug ocorreu</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - ({s.status})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Descrição do Bug *</label>
                <textarea 
                  className="form-input" 
                  required
                  placeholder="Descreva detalhadamente o comportamento inesperado..."
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Evidência (Imagem) - Opcional</label>
                <div 
                  className="file-drop-area" 
                  style={{ 
                    border: '2px dashed var(--border)', borderRadius: '8px', padding: '2rem',
                    textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => document.getElementById('bug-evidence-upload').click()}
                >
                  <UploadCloud size={32} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {evidenceFile ? evidenceFile.name : 'Clique para selecionar uma imagem'}
                  </p>
                  <input 
                    id="bug-evidence-upload" 
                    type="file" 
                    accept="image/*"
                    style={{ display: 'none' }} 
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        setEvidenceFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                {evidenceFile && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>✓ Arquivo anexado</span>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '0 0.5rem' }} onClick={() => setEvidenceFile(null)}>
                      Remover
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setIsModalOpen(false);
                  if (location.search) navigate('/bugs', { replace: true });
                }}>Cancelar</button>
                <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando...' : 'Registrar Bug'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
