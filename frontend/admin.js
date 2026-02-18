import './style.css';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const DEFAULT_MESSAGE = "Hello [Name], your [DocType] is ready for collection. Please visit our office.";

const fetchStats = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/stats`);
        document.getElementById('statTotal').textContent = data.total;
        document.getElementById('statPending').textContent = data.pending;
        document.getElementById('statReady').textContent = data.ready;
    } catch (error) {
        console.error('Failed to fetch stats:', error);
    }
};

const fetchRegistrations = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/registrations/all`); // Show all for admin by default
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';
        window.currentData = data; // Store for export

        data.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.name}</td>
                <td>${user.phone_number}</td>
                <td>${user.document_type}</td>
                <td>${user.network_provider || 'N/A'}</td>
                <td><span class="badge badge-${user.status}">${user.status}</span></td>
                <td>
                    <button class="action-btn" ${user.status === 'ready' ? 'disabled' : ''} 
                        onclick="window.notifyUser(${user.id}, '${user.document_type}')">
                        Notify Ready
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to fetch registrations:', error);
    }
};

window.exportCSV = () => {
    if (!window.currentData) return;
    const headers = ['Name', 'Phone', 'Document Type', 'Provider', 'Status', 'Date'];
    const rows = window.currentData.map(u => [
        u.name, u.phone_number, u.document_type, u.network_provider, u.status, u.submission_date
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `doc-registrations-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.notifyUser = async (userId, docType) => {
    const message = DEFAULT_MESSAGE.replace('[DocType]', docType);
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
        await axios.post(`${API_URL}/notify`, { userId, message });
        alert('Notification sent successfully!');
        fetchStats();
        fetchRegistrations();
    } catch (error) {
        console.error('Notification error:', error);
        const errorMsg = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Failed to send notification.';
        alert(`Error: ${errorMsg}`);
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    fetchRegistrations();
});
