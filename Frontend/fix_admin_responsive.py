import os
import re

pages = [
    'VendorVerification.jsx',
    'CustomerVerification.jsx',
    'AdminOrders.jsx',
    'AdminPayments.jsx',
    'AdminCommissions.jsx',
    'AdminContactMessages.jsx'
]

pages_dir = 'src/pages'

for fn in pages:
    path = os.path.join(pages_dir, fn)
    if not os.path.exists(path):
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace flex stats/cards containers with dashboard-stats-grid
    content = re.sub(r'style=\{\{\s*display:\s*\'flex\'\s*,\s*flexWrap:\s*\'wrap\'\s*,\s*gap:\s*\'20px\'\s*\}\}', 'className="dashboard-stats-grid"', content)
    content = re.sub(r'style=\{\{\s*display:\s*\'flex\'\s*,\s*gap:\s*\'20px\'\s*,\s*marginBottom:\s*\'2rem\'\s*\}\}', 'className="dashboard-stats-grid"', content)
    content = re.sub(r'style=\{\{\s*display:\s*\'grid\'\s*,\s*gridTemplateColumns:\s*\'repeat\(3, 1fr\)\'\s*,\s*gap:\s*\'1\.5rem\'\s*,\s*marginBottom:\s*\'2rem\'\s*\}\}', 'className="dashboard-stats-grid"', content)

    # 2. Wrap tables with table-responsive div
    # Look for <table> and its parent container if it's a glass-panel
    if '<table' in content and 'table-responsive' not in content:
        content = content.replace('<table', '<div className="table-responsive"><table')
        content = content.replace('</table>', '</table></div>')

    # 3. Fix card widths (remove hardcoded 300px/250px inside loops)
    content = content.replace("width: '300px'", "")
    content = content.replace("width: '250px'", "")

    # 4. Filter bar / Action rows
    content = re.sub(r'style=\{\{\s*display:\s*\'flex\'\s*,\s*gap:\s*\'10px\'\s*,\s*marginBottom:\s*\'1rem\'\s*,\s*alignItems:\s*\'center\'\s*\}\}', 'className="dashboard-row wrap"', content)
    content = re.sub(r'style=\{\{\s*display:\s*\'flex\'\s*,\s*gap:\s*\'0\.5rem\'\s*,\s*marginBottom:\s*\'1.5rem\'\s*\}\}', 'className="dashboard-row wrap"', content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Admin pages refactored for responsiveness.")
