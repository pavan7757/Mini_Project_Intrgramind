// Event listeners
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') performSearch();
});

// Add click event listener to search button
document.querySelector('.search-box button').addEventListener('click', function() {
    performSearch();
});

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const noResults = document.getElementById('noResults');
    const stats = document.getElementById('stats');

    loading.style.display = 'block';
    results.innerHTML = '';
    noResults.style.display = 'none';

    try {
        const titleBoost = document.getElementById('titleBoost').checked;
        const limit = document.getElementById('limit').value;

        const params = new URLSearchParams({
            q: query,
            limit: limit
        });
        if (titleBoost) {
            params.append('field', 'title');
            params.append('boost', '10');
        }

        const response = await fetch(`/search?${params}`);
        const data = await response.json();

        loading.style.display = 'none';
        stats.textContent = `${data.total} results (MongoDB: ${data.mongodb ? 'Connected' : 'Offline'})`;

        if (data.results.length === 0) {
            noResults.style.display = 'block';
            return;
        }

        data.results.forEach(result => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `
                <div class="result-title">${result.title || result.docId}</div>
                <div class="result-content">${result.content ? result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '') : ''}</div>
                <div class="result-score">Score: ${result.score}</div>
            `;
            results.appendChild(div);
        });
    } catch (error) {
        loading.style.display = 'none';
        results.innerHTML = `<div style="color:red;">Error: ${error.message}</div>`;
    }
}

async function showHealth() {
    const response = await fetch('/health');
    const data = await response.json();
    
    const panel = document.getElementById('healthPanel');
    panel.innerHTML = `
        <strong>✅ Engine Status</strong><br>
        MongoDB: ${data.mongodbConnected ? '🟢 Connected (' + data.mongodb.docs + ' docs)' : '🔴 Offline'}<br>
        Inverted Index: 🟢 ${data.invertedIndex.docs} docs, ${data.invertedIndex.terms} terms
    `;
}

window.addEventListener('DOMContentLoaded', () => {
    showHealth();
});

async function addDocument() {
    const title = document.getElementById('docTitle').value;
    const content = document.getElementById('docContent').value;
    
    if (!content.trim()) {
        alert('Enter some content!');
        return;
    }

    try {
        const response = await fetch('/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        const data = await response.json();
        
        alert(`✅ Document added! ID: ${data.docId}`);
        document.getElementById('docTitle').value = '';
        document.getElementById('docContent').value = '';
        showHealth();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Auto-search demo data - DISABLED to avoid interfering with user searches
// setTimeout(() => {
//     document.getElementById('searchInput').value = 'react';
//     performSearch();
// }, 1000);