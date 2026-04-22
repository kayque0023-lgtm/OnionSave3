import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, sprintsAPI, stepsAPI, commentsAPI, uploadsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Plus, Trash2, Send, Edit3, Save, X, FileText, ExternalLink, UploadCloud, ClipboardList, FlaskConical, Code2, UserCircle, MessageSquare, TestTube2, Bug, Hash } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado (Passed)' },
  { value: 'rejected', label: 'Rejeitado (Failed)' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'bug', label: 'Bug' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSprintName, setNewSprintName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newSteps, setNewSteps] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id]);

  const startEditing = () => {
    setEditForm({
      name: project.name || '',
      proposal_number: project.proposal_number || '',
      developer_name: project.developer_name || '',
      qa_name: project.qa_name || '',
      manager_name: project.manager_name || '',
      scope_summary: project.scope_summary || '',
      status: project.status || 'active'
    });
    setEditFile(null);
    setIsEditing(true);
  };

  const handleSaveProject = async () => {
    if (!editForm.name.trim()) return alert('O nome do projeto é obrigatório.');
    setIsSaving(true);
    try {
      let attachment_path = project.attachment_path;
      if (editFile) {
        const uploadRes = await uploadsAPI.uploadScope(editFile);
        attachment_path = uploadRes.data.file_path;
      }

      const res = await projectsAPI.update(project.id, {
        ...editForm,
        attachment_path
      });
      setProject(res.data.project);
      setIsEditing(false);
    } catch (err) {
      alert('Erro ao salvar projeto');
    } finally {
      setIsSaving(false);
    }
  };

  const loadProject = async () => {
    try {
      const res = await projectsAPI.get(id);
      setProject(res.data.project);
      setSprints(res.data.sprints || []);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error('Erro ao carregar projeto:', err);
      if (err.response?.status === 404) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const addSprint = async () => {
    if (!newSprintName.trim()) return;
    try {
      const res = await sprintsAPI.create(id, { name: newSprintName });
      setSprints([...sprints, res.data.sprint]);
      setNewSprintName('');
    } catch (err) {
      alert('Erro ao criar sprint');
    }
  };

  const updateSprintStatus = async (sprintId, status) => {
    try {
      if (status === 'bug') {
        // Redireciona para aba de bugs passando referencias
        navigate(`/bugs?new=true&projectId=${id}&sprintId=${sprintId}`);
        return;
      }
      
      const res = await sprintsAPI.update(sprintId, { status });
      setSprints(sprints.map(s => s.id === sprintId ? res.data.sprint : s));
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const deleteSprint = async (sprintId) => {
    if (!window.confirm('Excluir este test case e todos os steps?')) return;
    try {
      await sprintsAPI.delete(sprintId);
      setSprints(sprints.filter(s => s.id !== sprintId));
    } catch (err) {
      alert('Erro ao excluir sprint');
    }
  };

  const addStep = async (sprintId) => {
    const desc = newSteps[sprintId];
    if (!desc?.trim()) return;
    try {
      const res = await stepsAPI.create(sprintId, { description: desc });
      setSprints(sprints.map(s => {
        if (s.id === sprintId) {
          return { ...s, steps: [...(s.steps || []), res.data.step] };
        }
        return s;
      }));
      setNewSteps({ ...newSteps, [sprintId]: '' });
    } catch (err) {
      alert('Erro ao criar step');
    }
  };

  const deleteStep = async (stepId, sprintId) => {
    try {
      await stepsAPI.delete(stepId);
      setSprints(sprints.map(s => {
        if (s.id === sprintId) {
          return { ...s, steps: s.steps.filter(st => st.id !== stepId) };
        }
        return s;
      }));
    } catch (err) {
      alert('Erro ao excluir step');
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await commentsAPI.create(id, { content: newComment });
      setComments([res.data.comment, ...comments]);
      setNewComment('');
    } catch (err) {
      alert('Erro ao adicionar comentário');
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.'))
      return;
    try {
      await projectsAPI.delete(id);
      navigate('/projects');
    } catch (err) {
      alert('Erro ao excluir projeto');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!project) return null;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/projects')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{project.name}</h1>
            <div className="project-meta" style={{ marginTop: '0.25rem' }}>
              {project.proposal_number && <span className="project-meta-item"><Hash size={12} /> {project.proposal_number}</span>}
              {project.qa_name && <span className="project-meta-item"><FlaskConical size={12} /> {project.qa_name}</span>}
              {project.developer_name && <span className="project-meta-item"><Code2 size={12} /> {project.developer_name}</span>}
              {project.manager_name && <span className="project-meta-item"><UserCircle size={12} /> {project.manager_name}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={startEditing}>
            <Edit3 size={14} /> Editar
          </button>
          <button className="btn btn-danger btn-sm" onClick={deleteProject}>
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      </div>

      {/* Scope */}
      {(project.scope_summary || project.attachment_path) && (
        <div className="card mb-2">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} style={{ color: 'var(--accent)' }} /> Escopo</h2>
          </div>
          {project.scope_summary && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {project.scope_summary}
            </p>
          )}
          {project.attachment_path && (
            <div className="file-preview mt-1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <FileText size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="file-preview-name" style={{ display: 'block', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} /> Arquivo do escopo
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {project.attachment_path.split('/').pop()}
                </span>
              </div>
              <a
                href={`http://localhost:8000${project.attachment_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0, textDecoration: 'none' }}
              >
                <ExternalLink size={14} /> Visualizar / Baixar
              </a>
            </div>
          )}
        </div>
      )}

      {/* Sprints Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TestTube2 size={18} style={{ color: 'var(--accent)' }} /> Test Cases ({sprints.length})</h2>
        </div>

        {/* Add Sprint */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <input className="form-input" placeholder="Nome do test case..."
            value={newSprintName} onChange={e => setNewSprintName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addSprint(); }}
          />
          <button className="btn btn-primary" onClick={addSprint}>
            <Plus size={16} /> Adicionar
          </button>
        </div>

        {/* Sprint Cards */}
        {sprints.map(sprint => (
          <div key={sprint.id} className="sprint-card">
            <div className="sprint-header">
              <div className="sprint-name">
                <ClipboardList size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> {sprint.name}
                <StatusBadge status={sprint.status} />
              </div>
              <div className="sprint-actions">
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '0.375rem 2rem 0.375rem 0.75rem', fontSize: '0.8rem' }}
                  value={sprint.status}
                  onChange={e => updateSprintStatus(sprint.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteSprint(sprint.id)} title="Excluir test case">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="sprint-body">
              {sprint.steps?.length > 0 && (
                <ul className="step-list">
                  {sprint.steps.map((stepItem, sti) => (
                    <li key={stepItem.id} className="step-item">
                      <div className="step-number">{sti + 1}</div>
                      <div className="step-content">
                        <p className="step-description">{stepItem.description}</p>
                        {stepItem.expected_result && (
                          <p className="step-expected">Esperado: {stepItem.expected_result}</p>
                        )}
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteStep(stepItem.id, sprint.id)}>
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="add-step-form">
                <input className="form-input" placeholder="Adicionar passo de teste..."
                  value={newSteps[sprint.id] || ''}
                  onChange={e => setNewSteps({ ...newSteps, [sprint.id]: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') addStep(sprint.id); }}
                />
                <button className="btn btn-secondary btn-sm" onClick={() => addStep(sprint.id)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sprints.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <TestTube2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.4 }} />
              <p className="empty-state-title">Nenhum test case criado</p>
              <p className="empty-state-text">Adicione test cases para organizar seus testes</p>
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={16} style={{ color: 'var(--accent)' }} /> Comentários ({comments.length})</h2>
        </div>

        <div className="comment-form">
          <input className="form-input" placeholder="Adicionar comentário sobre os testes..."
            value={newComment} onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addComment(); }}
          />
          <button className="btn btn-primary" onClick={addComment}>
            <Send size={16} />
          </button>
        </div>

        {comments.length > 0 ? (
          <div className="activity-feed">
            {comments.map(comment => (
              <div key={comment.id} className="activity-item">
                <div className="activity-avatar">
                  {comment.user_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <span className="activity-user">{comment.user_name}</span>
                    <span className="activity-time">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="activity-text">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <p className="empty-state-text">Nenhum comentário ainda</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Editar Projeto</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsEditing(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Nome do Projeto *</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Nº da Proposta</label>
                  <input className="form-input" value={editForm.proposal_number} onChange={e => setEditForm({...editForm, proposal_number: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Analista QA</label>
                  <input className="form-input" value={editForm.qa_name} onChange={e => setEditForm({...editForm, qa_name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Desenvolvedor</label>
                  <input className="form-input" value={editForm.developer_name} onChange={e => setEditForm({...editForm, developer_name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Gestor / Solicitante</label>
                  <input className="form-input" value={editForm.manager_name} onChange={e => setEditForm({...editForm, manager_name: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Resumo do Escopo</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={editForm.scope_summary} 
                  onChange={e => setEditForm({...editForm, scope_summary: e.target.value})} 
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>Novo Arquivo de Escopo (opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => document.getElementById('edit-scope-upload').click()}
                  >
                    <UploadCloud size={16} /> Selecionar Arquivo
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {editFile ? editFile.name : (project.attachment_path ? 'Manter arquivo atual' : 'Nenhum arquivo novo')}
                  </span>
                  <input 
                    id="edit-scope-upload" 
                    type="file" 
                    style={{ display: 'none' }} 
                    onChange={e => e.target.files[0] && setEditFile(e.target.files[0])}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveProject} disabled={isSaving}>
                  {isSaving ? 'Salvando...' : <Save size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />} 
                  {isSaving ? '' : 'Salvar'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
