<template>
  <div class="tessera-template" :style="{ backgroundColor: backgroundColor }">
    <div class="tessera-header">
      <div class="logo-section">
        <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 L95 25 L95 75 L50 100 L5 75 L5 25 Z" :fill="primaryColor" />
          <path
            d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
            stroke-width="3"
            :stroke="accentColor"
          />
          <text
            x="50"
            y="58"
            :fill="accentColor"
            font-size="24"
            text-anchor="middle"
            font-weight="bold"
          >
            S
          </text>
        </svg>
      </div>
      <div class="title-section">
        <h1>Famiglia Sant'antoniari</h1>
        <h2>Tessera Annuale</h2>
      </div>
    </div>

    <div class="tessera-content">
      <div class="info-section">
        <div class="info-row">
          <span class="label">Socio:</span>
          <span class="value">{{ nomeCognome }}</span>
        </div>
        <div class="info-row">
          <span class="label">Gruppo:</span>
          <span class="value">{{ gruppo }}</span>
        </div>
        <div class="info-row">
          <span class="label">Anno:</span>
          <span class="value">{{ anno }}</span>
        </div>
      </div>
    </div>

    <div class="tessera-footer">
      <p>Valida per l'anno {{ anno }}</p>
      <p>Firma del Responsabile ____________________</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  nomeCognome: {
    type: String,
    required: true,
  },
  gruppo: {
    type: String,
    required: true,
  },
  anno: {
    type: [String, Number],
    required: true,
  },
})

// Colori ufficiali
const primaryColor = '#1a1a1a' // Black
const accentColor = '#B71C1C' // Red
const backgroundColor = '#ffffff' // White background
</script>

<style scoped>
.tessera-template {
  width: 400px;
  height: 250px;
  border: 3px solid #333;
  border-radius: 15px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  font-family: 'Arial', sans-serif;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.tessera-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #b71c1c;
  padding-bottom: 10px;
}

.logo-section {
  margin-right: 15px;
}

.logo {
  width: 50px;
  height: 50px;
}

.title-section h1 {
  font-size: 18px;
  margin: 0 0 5px 0;
  color: #1a1a1a;
  font-weight: bold;
}

.title-section h2 {
  font-size: 14px;
  margin: 0;
  color: #b71c1c;
  font-weight: normal;
}

.tessera-content {
  flex-grow: 1;
  display: flex;
  align-items: center;
}

.info-section {
  width: 100%;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 5px 0;
}

.label {
  font-weight: bold;
  color: #1a1a1a;
  font-size: 14px;
  min-width: 80px;
}

.value {
  color: #333;
  font-size: 14px;
  text-align: right;
  flex-grow: 1;
  border-bottom: 1px dotted #ccc;
  padding-bottom: 2px;
}

.tessera-footer {
  border-top: 2px solid #b71c1c;
  padding-top: 10px;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.tessera-footer p {
  margin: 3px 0;
}
</style>
