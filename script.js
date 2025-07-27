// Ad Campaign Insights Dashboard
class CampaignDashboard {
    constructor() {
        this.campaigns = [];
        this.chart = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.renderCampaigns();
        this.initChart();
    }

    setupEventListeners() {
        const form = document.getElementById('campaignForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const campaignData = {
            name: formData.get('campaignName').trim(),
            impressions: parseInt(formData.get('impressions')),
            clicks: parseInt(formData.get('clicks')),
            budget: parseFloat(formData.get('budget'))
        };

        // Validate input data
        const validation = this.validateCampaignData(campaignData);
        if (!validation.isValid) {
            this.showMessage(validation.message, 'error');
            return;
        }

        // Calculate metrics
        const campaign = this.calculateMetrics(campaignData);
        
        // Add campaign
        this.addCampaign(campaign);
        
        // Reset form
        e.target.reset();
        
        // Show success message
        this.showMessage(`Campaign "${campaign.name}" added successfully!`, 'success');
    }

    validateCampaignData(data) {
        // Check for empty or invalid name
        if (!data.name || data.name.length === 0) {
            return { isValid: false, message: 'Campaign name is required' };
        }

        // Check for duplicate campaign names
        if (this.campaigns.some(campaign => campaign.name.toLowerCase() === data.name.toLowerCase())) {
            return { isValid: false, message: 'A campaign with this name already exists' };
        }

        // Validate impressions
        if (!data.impressions || data.impressions <= 0) {
            return { isValid: false, message: 'Impressions must be a positive number' };
        }

        // Validate clicks
        if (data.clicks < 0) {
            return { isValid: false, message: 'Clicks cannot be negative' };
        }

        // Validate clicks vs impressions
        if (data.clicks > data.impressions) {
            return { isValid: false, message: 'Clicks cannot exceed impressions' };
        }

        // Validate budget
        if (!data.budget || data.budget <= 0) {
            return { isValid: false, message: 'Budget must be a positive number' };
        }

        // Validate CPC calculation (avoid division by zero)
        if (data.clicks === 0 && data.budget > 0) {
            return { isValid: false, message: 'Cannot calculate CPC with zero clicks. Either increase clicks or set budget to zero.' };
        }

        return { isValid: true };
    }

    calculateMetrics(data) {
        // Calculate CTR (Click-Through Rate)
        const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
        
        // Calculate CPC (Cost Per Click)
        const cpc = data.clicks > 0 ? data.budget / data.clicks : 0;

        return {
            id: Date.now(), // Simple ID generation
            name: data.name,
            impressions: data.impressions,
            clicks: data.clicks,
            budget: data.budget,
            ctr: parseFloat(ctr.toFixed(2)),
            cpc: parseFloat(cpc.toFixed(2))
        };
    }

    addCampaign(campaign) {
        this.campaigns.push(campaign);
        this.saveToStorage();
        this.renderCampaigns();
        this.updateChart();
    }

    deleteCampaign(campaignId) {
        const campaignIndex = this.campaigns.findIndex(c => c.id === campaignId);
        if (campaignIndex !== -1) {
            const campaignName = this.campaigns[campaignIndex].name;
            this.campaigns.splice(campaignIndex, 1);
            this.saveToStorage();
            this.renderCampaigns();
            this.updateChart();
            this.showMessage(`Campaign "${campaignName}" deleted successfully!`, 'success');
        }
    }

    renderCampaigns() {
        const container = document.getElementById('campaignCards');
        const emptyState = document.getElementById('emptyState');

        if (this.campaigns.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Remove existing campaign cards (but keep empty state)
        const existingCards = container.querySelectorAll('.campaign-card');
        existingCards.forEach(card => card.remove());

        this.campaigns.forEach(campaign => {
            const campaignCard = this.createCampaignCard(campaign);
            container.appendChild(campaignCard);
        });
    }

    createCampaignCard(campaign) {
        const card = document.createElement('div');
        card.className = 'campaign-card fade-in';
        card.innerHTML = `
            <button class="delete-btn" onclick="dashboard.deleteCampaign(${campaign.id})" title="Delete campaign">
                ×
            </button>
            <h3>${this.escapeHtml(campaign.name)}</h3>
            <div class="metrics">
                <div class="metric">
                    <span class="metric-value">${campaign.ctr}%</span>
                    <div class="metric-label">CTR</div>
                </div>
                <div class="metric">
                    <span class="metric-value">₹${campaign.cpc}</span>
                    <div class="metric-label">CPC</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.9rem; color: #666; margin-top: 15px;">
                <div><strong>Impressions:</strong> ${campaign.impressions.toLocaleString()}</div>
                <div><strong>Clicks:</strong> ${campaign.clicks.toLocaleString()}</div>
                <div><strong>Budget:</strong> ₹${campaign.budget.toLocaleString()}</div>
            </div>
        `;
        return card;
    }

    initChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'CTR (%)',
                        data: [],
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'CPC (₹)',
                        data: [],
                        backgroundColor: 'rgba(118, 75, 162, 0.8)',
                        borderColor: 'rgba(118, 75, 162, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Campaign Performance Metrics',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Campaigns'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'CTR (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'CPC (₹)'
                        },
                        grid: {
                            drawOnChartArea: true,
                        },
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        this.updateChart();
    }

    updateChart() {
        if (!this.chart) return;

        const labels = this.campaigns.map(campaign => campaign.name);
        const ctrData = this.campaigns.map(campaign => campaign.ctr);
        const cpcData = this.campaigns.map(campaign => campaign.cpc);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = ctrData;
        this.chart.data.datasets[1].data = cpcData;

        this.chart.update();
    }

    showMessage(message, type) {
        const container = document.getElementById('messageContainer');
        
        // Clear existing messages
        container.innerHTML = '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type} fade-in`;
        messageDiv.textContent = message;
        
        container.appendChild(messageDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.transition = 'opacity 0.5s ease';
                messageDiv.style.opacity = '0';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 500);
            }
        }, 5000);
    }

    saveToStorage() {
        try {
            localStorage.setItem('campaignData', JSON.stringify(this.campaigns));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            this.showMessage('Failed to save data locally', 'error');
        }
    }

    loadFromStorage() {
        try {
            const storedData = localStorage.getItem('campaignData');
            if (storedData) {
                this.campaigns = JSON.parse(storedData);
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.showMessage('Failed to load saved data', 'error');
            this.campaigns = [];
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the dashboard when the page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new CampaignDashboard();
});

// Handle page visibility change to save data
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dashboard) {
        dashboard.saveToStorage();
    }
});

// Handle beforeunload to save data
window.addEventListener('beforeunload', () => {
    if (dashboard) {
        dashboard.saveToStorage();
    }
});
