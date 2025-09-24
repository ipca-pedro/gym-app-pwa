// Body Tracker Manager
class BodyTracker {
    constructor() {
        this.measurements = this.loadMeasurements();
    }

    load() {
        this.renderWeightChart();
        this.renderMeasurements();
        this.updateStats();
    }

    // Weight Tracking
    addWeightEntry(weight, date = new Date()) {
        const entry = {
            id: Date.now().toString(),
            weight: parseFloat(weight),
            date: date.toISOString(),
            bmi: this.calculateBMI(weight)
        };

        this.measurements.weight = this.measurements.weight || [];
        this.measurements.weight.unshift(entry);
        this.measurements.weight = this.measurements.weight.slice(0, 100); // Keep last 100 entries
        
        this.saveMeasurements();
        this.renderWeightChart();
        this.updateStats();
    }

    // Body Measurements
    addMeasurement(type, value, date = new Date()) {
        const entry = {
            id: Date.now().toString(),
            value: parseFloat(value),
            date: date.toISOString()
        };

        this.measurements[type] = this.measurements[type] || [];
        this.measurements[type].unshift(entry);
        this.measurements[type] = this.measurements[type].slice(0, 50);
        
        this.saveMeasurements();
        this.renderMeasurements();
    }



    // Calculations
    calculateBMI(weight) {
        if (!app.currentUser?.profile?.height) return null;
        
        const heightM = app.currentUser.profile.height / 100;
        return (weight / (heightM * heightM)).toFixed(1);
    }

    calculateBodyFat(measurements) {
        // Simple body fat estimation (Navy method for men)
        if (!measurements.waist || !measurements.neck || !app.currentUser?.profile?.height) {
            return null;
        }

        const height = app.currentUser.profile.height;
        const waist = measurements.waist;
        const neck = measurements.neck;

        // Simplified formula
        const bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
        return Math.max(0, Math.min(50, bodyFat)).toFixed(1);
    }

    // Rendering
    renderWeightChart() {
        const chartContainer = document.getElementById('weightChart');
        if (!chartContainer) return;

        const weights = this.measurements.weight || [];
        if (weights.length === 0) {
            chartContainer.innerHTML = '<p class="text-center">Nenhum registro de peso ainda</p>';
            return;
        }

        const last30Days = weights.slice(0, 30).reverse();
        const maxWeight = Math.max(...last30Days.map(w => w.weight));
        const minWeight = Math.min(...last30Days.map(w => w.weight));
        const range = maxWeight - minWeight || 1;

        const bars = last30Days.map(entry => {
            const height = ((entry.weight - minWeight) / range) * 100;
            const date = new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            return `
                <div class="chart-bar" style="height: ${height}%" title="${entry.weight}kg - ${date}">
                    <div class="bar-value">${entry.weight}</div>
                </div>
            `;
        }).join('');

        chartContainer.innerHTML = `
            <div class="chart-container">
                <h3>Evolução do Peso (30 dias)</h3>
                <div class="chart-bars">${bars}</div>
            </div>
        `;
    }

    renderMeasurements() {
        const measurementTypes = ['arm', 'chest', 'waist', 'hip', 'thigh', 'neck'];
        
        measurementTypes.forEach(type => {
            const historyElement = document.getElementById(`${type}History`);
            if (!historyElement) return;
            
            const latest = this.measurements[type]?.[0];
            const previous = this.measurements[type]?.[1];
            
            if (latest) {
                const change = previous ? (latest.value - previous.value).toFixed(1) : null;
                let displayText = `${latest.value}cm`;
                
                if (change) {
                    historyElement.className = 'measurement-history';
                    if (parseFloat(change) > 0) {
                        historyElement.classList.add('increased');
                        displayText += ` (+${change})`;
                    } else if (parseFloat(change) < 0) {
                        historyElement.classList.add('decreased');
                        displayText += ` (${change})`;
                    }
                }
                
                historyElement.textContent = displayText;
            } else {
                historyElement.textContent = '--';
            }
        });
    }



    updateStats() {
        // Update BMI
        const bmiElement = document.getElementById('currentBMI');
        const latestWeight = this.measurements.weight?.[0];
        
        if (bmiElement && latestWeight) {
            const bmi = latestWeight.bmi;
            const category = this.getBMICategory(bmi);
            bmiElement.innerHTML = `
                <div class="stat-number">${bmi || '--'}</div>
                <div class="stat-label">IMC - ${category}</div>
            `;
        }

        // Update Body Fat
        const bfElement = document.getElementById('currentBodyFat');
        if (bfElement) {
            const latest = {
                waist: this.measurements.waist?.[0]?.value,
                neck: this.measurements.neck?.[0]?.value
            };
            
            const bodyFat = this.calculateBodyFat(latest);
            bfElement.innerHTML = `
                <div class="stat-number">${bodyFat || '--'}%</div>
                <div class="stat-label">Gordura Corporal</div>
            `;
        }
    }

    getBMICategory(bmi) {
        if (!bmi) return 'N/A';
        if (bmi < 18.5) return 'Abaixo';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Sobrepeso';
        return 'Obesidade';
    }

    // Modal Functions
    showMeasurementHistory(type) {
        const measurements = this.measurements[type] || [];
        // Implementation for showing measurement history modal
        console.log(`Showing history for ${type}:`, measurements);
    }



    // Data Management
    loadMeasurements() {
        const data = localStorage.getItem(`measurements_${app.currentUser?.id}`);
        return data ? JSON.parse(data) : {};
    }

    saveMeasurements() {
        localStorage.setItem(`measurements_${app.currentUser?.id}`, JSON.stringify(this.measurements));
    }



    // Export Data
    exportData() {
        const data = {
            measurements: this.measurements,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gym-app-body-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize body tracker
const bodyTracker = new BodyTracker();