import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { projectsAPI, commentsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { BarChart3, FolderOpen, Bug, CheckCircle, Clock, AlertTriangle, MessageSquare, Search, FlaskConical, Code2, UserCircle, ClipboardList } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projRes, commRes] = await Promise.all([
        projectsAPI.list(),
        commentsAPI.recent().catch(() => ({ data: { comments: [] } }))
      ]);
      const loadedProjects = projRes.data.projects || [];
      setProjects(loadedProjects);
      if (loadedProjects.length > 0) setSelectedProjectId(loadedProjects[0].id.toString());
      setRecentComments(commRes.data.comments || []);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate stats
  const stats = projects.reduce((acc, p) => ({
    approved: acc.approved + (p.approved_count || 0),
    bugs: acc.bugs + (p.bug_count || 0),
    blocked: acc.blocked + (p.blocked_count || 0),
    rejected: acc.rejected + (p.rejected_count || 0),
    pending: acc.pending + (p.pending_count || 0),
    total: acc.total + (p.sprint_count || 0),
  }), { approved: 0, bugs: 0, blocked: 0, rejected: 0, pending: 0, total: 0 });

  const chartData = {
    labels: ['Passed (Aprovados)', 'Failed (Rejeitados)', 'Pending (Pendentes)', 'Bug', 'Bloqueados'],
    datasets: [{
      data: [stats.approved, stats.rejected, stats.pending, stats.bugs, stats.blocked],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)', // Green
        'rgba(239, 68, 68, 0.8)',  // Red
        'rgba(234, 179, 8, 0.8)',  // Yellow
        'rgba(15, 23, 42, 0.8)',   // Black
        'rgba(245, 158, 11, 0.8)', // Orange
      ],
      borderColor: [
        '#22C55E',
        '#EF4444',
        '#EAB308',
        '#0F172A',
        '#F59E0B',
      ],
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94A3B8',
          padding: 16,
          font: { family: 'Inter', size: 12 },
          boxWidth: 0,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 31, 61, 0.95)',
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: 'Inter', weight: '600' },
        bodyFont: { family: 'Inter' },
      }
    }
  };

  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);

  const barChartData = {
    labels: ['Passed', 'Failed', 'Pending', 'Bug', 'Bloqueados'],
    datasets: [{
      label: 'Quantidade',
      data: selectedProject ? [
        selectedProject.approved_count || 0,
        selectedProject.rejected_count || 0,
        selectedProject.pending_count || 0,
        selectedProject.bug_count || 0,
        selectedProject.blocked_count || 0,
      ] : [0,0,0,0,0],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)', 
        'rgba(234, 179, 8, 0.8)', 
        'rgba(15, 23, 42, 0.8)',  
        'rgba(245, 158, 11, 0.8)'
      ],
      borderRadius: 4,
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: chartOptions.plugins.tooltip
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10 } }, grid: { display: false } }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral dos seus projetos e testes</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Pie Chart */}
        <div className="card dashboard-chart-card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
                Status de Testes
              </h2>
              <p className="card-subtitle">Distribuição geral dos sprints</p>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total: {stats.total} sprints
            </span>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stats.total > 0 ? (
              <Pie data={chartData} options={chartOptions} />
            ) : (
            <div className="empty-state">
                <BarChart3 size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.4 }} />
                <p className="empty-state-title">Sem dados ainda</p>
                <p className="empty-state-text">Crie um projeto e adicione test cases para ver os gráficos</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="card dashboard-stats-card">
          <div className="card-header">
            <h2 className="card-title">Resumo</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--accent)' }}>
                <FolderOpen size={24} style={{ display: 'inline', marginRight: '4px' }} />
                {projects.length}
              </div>
              <div className="stat-label">Projetos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--status-approved)' }}>
                <CheckCircle size={24} style={{ display: 'inline', marginRight: '4px' }} />
                {stats.approved}
              </div>
              <div className="stat-label">Aprovados</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--status-bug)' }}>
                <Bug size={24} style={{ display: 'inline', marginRight: '4px' }} />
                {stats.bugs}
              </div>
              <div className="stat-label">Bugs</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--status-blocked)' }}>
                <AlertTriangle size={24} style={{ display: 'inline', marginRight: '4px' }} />
                {stats.blocked}
              </div>
              <div className="stat-label">Bloqueados</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--status-rejected)' }}>
                {stats.rejected}
              </div>
              <div className="stat-label">Rejeitados</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--status-pending)' }}>
                <Clock size={24} style={{ display: 'inline', marginRight: '4px' }} />
                {stats.pending}
              </div>
              <div className="stat-label">Pendentes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart - Por Projeto Especifico */}
      {projects.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
                Status por Projeto em Específico
              </h2>
              <p className="card-subtitle">Selecione o projeto que deseja observar</p>
            </div>
            <select 
              className="form-select" 
              style={{ maxWidth: '300px', flex: '1 1 auto' }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              {selectedProject ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <div className="empty-state">
                  <p className="empty-state-text">Nenhum projeto selecionado</p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={18} style={{ color: 'var(--accent)' }} />
            Atividades Recentes
          </h2>
        </div>
        {recentComments.length > 0 ? (
          <div className="activity-feed">
            {recentComments.map(comment => (
              <div key={comment.id} className="activity-item">
                <div className="activity-avatar">
                  {comment.user_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <div>
                      <span className="activity-user">{comment.user_name}</span>
                      {comment.project_name && (
                        <span className="activity-project" style={{ marginLeft: '0.5rem' }}>
                          {comment.project_name}
                        </span>
                      )}
                    </div>
                    <span className="activity-time">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="activity-text">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.4 }} />
            <p className="empty-state-title">Nenhuma atividade recente</p>
            <p className="empty-state-text">Comentários dos seus projetos aparecerão aqui</p>
          </div>
        )}
      </div>

      {/* Quick Project Cards */}
      {projects.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-title mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen size={18} style={{ color: 'var(--accent)' }} />
            Seus Projetos
          </h2>
          
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              id="search-dashboard-projects"
              className="form-input"
              style={{ paddingLeft: '2.5rem', maxWidth: '400px', background: '#fff', color: '#1a1a1a', border: '1px solid rgba(0,0,0,0.1)' }}
              placeholder="Pesquisar projetos..."
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
            />
          </div>

          <div className="projects-grid">
            {projects
              .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
              .slice(0, 6)
              .map(project => {
              const total = (project.approved_count || 0) + (project.bug_count || 0) +
                (project.blocked_count || 0) + (project.rejected_count || 0) + (project.pending_count || 0);
              return (
                <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
                  <h3 className="project-name">{project.name}</h3>
                  <div className="project-meta">
                    {project.qa_name && <span className="project-meta-item"><FlaskConical size={12} /> {project.qa_name}</span>}
                    {project.developer_name && <span className="project-meta-item"><Code2 size={12} /> {project.developer_name}</span>}
                    <span className="project-meta-item"><ClipboardList size={12} /> {project.sprint_count || 0} test cases</span>
                  </div>
                  {total > 0 && (
                    <div className="project-stats-bar">
                      <div style={{ width: `${(project.approved_count / total) * 100}%`, background: 'var(--status-approved)' }} />
                      <div style={{ width: `${(project.bug_count / total) * 100}%`, background: 'var(--status-bug)' }} />
                      <div style={{ width: `${(project.blocked_count / total) * 100}%`, background: 'var(--status-blocked)' }} />
                      <div style={{ width: `${(project.rejected_count / total) * 100}%`, background: 'var(--status-rejected)' }} />
                      <div style={{ width: `${(project.pending_count / total) * 100}%`, background: 'var(--status-pending)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
