export default function StatusBadge({ status }) {
  const labels = {
    approved: 'Aprovado',
    bug: 'Bug',
    blocked: 'Bloqueado',
    rejected: 'Rejeitado',
    pending_approval: 'Pendente',
    pending: 'Pendente',
  };

  return (
    <span className={`status-badge status-${status}`}>
      {labels[status] || status}
    </span>
  );
}
