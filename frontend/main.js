import './style.css';
import axios from 'axios';

const registrationForm = document.querySelector('#registrationForm');
const API_URL = 'http://localhost:3000/api';

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = registrationForm.querySelector('button');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;

        const formData = {
            name: document.querySelector('#name').value,
            phone_number: document.querySelector('#phone').value,
            document_type: document.querySelector('#docType').value,
            network_provider: document.querySelector('#network').value,
            submission_date: new Date().toISOString().split('T')[0]
        };

        try {
            const response = await axios.post(`${API_URL}/register`, formData);
            showToast('Registration successful!');
            registrationForm.reset();
        } catch (error) {
            console.error('Registration error:', error);
            showToast('Registration failed. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}
