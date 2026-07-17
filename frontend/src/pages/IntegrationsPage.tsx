interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
}

const INTEGRATIONS: Integration[] = [
  { id: 'gemini', name: 'Google Gemini', description: 'Primary AI extraction provider', icon: 'ti-brand-google', connected: true },
  { id: 'openrouter', name: 'OpenRouter', description: 'Fallback AI providers (Qwen, Gemma, Nemotron)', icon: 'ti-route', connected: true },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Export extracted invoices directly to your books', icon: 'ti-book', connected: false },
  { id: 'xero', name: 'Xero', description: 'Sync invoice data with your accounting platform', icon: 'ti-report-money', connected: false },
  { id: 'slack', name: 'Slack', description: 'Get notified when documents finish processing', icon: 'ti-brand-slack', connected: false },
  { id: 'zapier', name: 'Zapier', description: 'Connect ClarityDocs to thousands of apps', icon: 'ti-bolt', connected: false },
];

export function IntegrationsPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <div className="page-header__title">Integrations</div>
          <div className="page-header__sub">Connect ClarityDocs to your other tools</div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {INTEGRATIONS.map(integration => (
            <div key={integration.id} className="stat-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                background: integration.connected ? 'var(--color-success-bg)' : 'var(--color-surface-1)',
                color: integration.connected ? 'var(--color-success-text)' : 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
              }}>
                <i className={`ti ${integration.icon}`} aria-hidden="true" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{integration.name}</div>
                  {integration.connected ? (
                    <span className="badge badge--invoice">Connected</span>
                  ) : (
                    <button className="btn btn--secondary btn--sm">Connect</button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {integration.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}