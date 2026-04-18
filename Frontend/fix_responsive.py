import os

pages_dir = 'src/pages'
components_dir = 'src/components'
count = 0

for root_dir in [pages_dir, components_dir]:
    for fn in os.listdir(root_dir):
        if fn.endswith('.jsx'):
            path = os.path.join(root_dir, fn)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content.replace("style={{ display: 'flex', gap: '2rem', marginTop: '1rem', position: 'relative' }}", 'className="dashboard-layout"')
            new_content = new_content.replace("style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}", 'className="dashboard-layout"')
            new_content = new_content.replace("style={{ display: 'flex', gap: '1.5rem' }}", 'className="dashboard-row"')
            new_content = new_content.replace("style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}", 'className="dashboard-row wrap"')
            new_content = new_content.replace("style={{ width: '250px', padding: '1.5rem', height: 'fit-content' }}", '')
            new_content = new_content.replace('className="glass-panel" style={{ width: \'250px\', padding: \'1.5rem\', height: \'fit-content\' }}', 'className="dashboard-sidebar glass-panel"')
            new_content = new_content.replace('<aside className="glass-panel" >', '<aside className="dashboard-sidebar glass-panel">')

            if new_content != content:
                count += 1
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)

print(f'Modified {count} files')
