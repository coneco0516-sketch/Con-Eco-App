import os

pages_dir = 'src/pages'
pages = [
    'AdminCommissions.jsx',
    'AdminPayments.jsx',
    'AdminOrders.jsx',
    'AdminContactMessages.jsx'
]

for fn in pages:
    path = os.path.join(pages_dir, fn)
    if not os.path.exists(path): continue
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the container of header/buttons with dashboard-header-row
    content = content.replace('style={{ padding: \'1.5rem\', marginBottom: \'2rem\', display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\' }}', 'className="glass-panel dashboard-header-row" style={{ padding: \'1.5rem\', marginBottom: \'2rem\' }}')
    content = content.replace('style={{ padding: \'1rem 1.5rem\', borderBottom: \'1px solid var(--surface-border)\', display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}', 'className="dashboard-header-row" style={{ padding: \'1rem 1.5rem\', borderBottom: \'1px solid var(--surface-border)\' }}')
    content = content.replace('style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'1.25rem\' }}', 'className="dashboard-header-row" style={{ marginBottom: \'1.25rem\' }}')
    content = content.replace('style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'0.8rem\' }}', 'className="dashboard-header-row" style={{ marginBottom: \'0.8rem\' }}')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Applied dashboard-header-row to admin pages.")
