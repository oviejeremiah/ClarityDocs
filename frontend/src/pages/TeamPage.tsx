function getUser(): { name: string; email: string; role: string } {
  try {
    return JSON.parse(localStorage.getItem('clarity_user') ?? '{}');
  } catch {
    return { name: 'User', email: '', role: 'admin' };
  }
}

export function TeamPage() {
  const user = getUser();
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <div className="page-header__title">Team</div>
          <div className="page-header__sub">Manage who has access to this workspace</div>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary btn--sm">
            <i className="ti ti-user-plus" aria-hidden="true" style={{ fontSize: '14px' }} />
            Invite member
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="doc-table">
          <div className="doc-table__head" style={{ gridTemplateColumns: '2fr 1fr 1fr 100px' }}>
            <div className="doc-table__th">Member</div>
            <div className="doc-table__th">Role</div>
            <div className="doc-table__th">Status</div>
            <div className="doc-table__th" style={{ textAlign: 'right' }}>Actions</div>
          </div>
          <div className="doc-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 100px' }}>
            <div className="doc-row__name">
              <div className="sidebar__avatar" style={{ width: '32px', height: '32px' }}>{initials}</div>
              <div>
                <div className="doc-row__title">{user.name}</div>
                <div className="doc-row__meta">{user.email}</div>
              </div>
            </div>
            <div><span className="badge badge--invoice" style={{ textTransform: 'capitalize' }}>{user.role}</span></div>
            <div><div className="status status--completed"><span className="status__dot" /><span className="status__text">Active</span></div></div>
            <div className="row-actions" style={{ justifyContent: 'flex-end', display: 'flex' }}>
              <button className="btn--icon" title="Settings"><i className="ti ti-dots" aria-hidden="true" /></button>
            </div>
          </div>
        </div>

        <div className="empty-state" style={{ marginTop: '16px' }}>
          <div className="empty-state__icon"><i className="ti ti-users" aria-hidden="true" /></div>
          <div className="empty-state__title">Invite your team</div>
          <div className="empty-state__text">Add colleagues to collaborate on document processing.</div>
        </div>
      </div>
    </>
  );
}