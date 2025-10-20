<template>
  <div class="tessera-vertical">
    <div
      class="tessera-front"
      :style="{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }"
    >
      <!-- Parte superiore con gradiente dei colori -->
      <div class="header-section">
        <div class="logo-container">
          <svg class="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#1a1a1a" />
            <path
              d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z"
              stroke="#B71C1C"
              stroke-width="2.5"
              fill="none"
            />
            <text
              x="50"
              y="60"
              fill="#B71C1C"
              font-size="32"
              text-anchor="middle"
              font-weight="bold"
              font-family="serif"
            >
              S
            </text>
          </svg>
        </div>
        <div class="title">
          <h1>Famiglia</h1>
          <h2>Santanoniari</h2>
          <p class="subtitle">Gubbio</p>
        </div>
      </div>

      <!-- Decorazione centrale con fiamma -->
      <div class="flame-decoration">
        <svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M30 10 Q35 25 30 35 Q32 30 35 28 Q38 40 30 50 Q28 45 25 48 Q20 35 30 10"
            fill="#B71C1C"
            opacity="0.15"
          />
        </svg>
      </div>

      <!-- Sezione dati socio -->
      <div class="member-info">
        <div class="info-group">
          <label>Socio</label>
          <div class="info-value">{{ nomeCognome }}</div>
        </div>

        <div class="info-row">
          <div class="info-group small">
            <label>Data nascita</label>
            <div class="info-value">{{ dataNascita }}</div>
          </div>
          <div class="info-group small">
            <label>Anno</label>
            <div class="info-value">{{ anno }}</div>
          </div>
        </div>
      </div>

      <!-- Footer con pattern decorativo -->
      <div class="footer-pattern"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  nomeCognome: {
    type: String,
    required: true,
  },
  dataNascita: {
    type: String,
    required: true,
  },
  anno: {
    type: [String, Number],
    required: true,
  },
  backgroundImage: {
    type: String,
    default: null,
  },
})
</script>

<style scoped>
.tessera-vertical {
  width: 85.6mm;
  height: 53.98mm;
  perspective: 1000px;
  font-family: 'Arial', 'Helvetica', sans-serif;
}

.tessera-front {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 3.18mm;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 5mm;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.header-section {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin-bottom: 4mm;
  z-index: 2;
}

.logo-container {
  flex-shrink: 0;
}

.logo {
  width: 12mm;
  height: 12mm;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.title {
  flex-grow: 1;
}

.title h1 {
  font-size: 4.5mm;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.3px;
}

.title h2 {
  font-size: 4mm;
  font-weight: 600;
  color: #b71c1c;
  margin: 0.5mm 0 0 0;
  line-height: 1;
}

.subtitle {
  font-size: 2.5mm;
  color: #666;
  margin: 0.5mm 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.flame-decoration {
  position: absolute;
  right: -5mm;
  top: 50%;
  transform: translateY(-50%);
  width: 20mm;
  height: 25mm;
  opacity: 0.4;
  z-index: 1;
}

.member-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 3mm;
  z-index: 2;
  margin-top: 2mm;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 1mm;
}

.info-group.small {
  flex: 1;
}

.info-row {
  display: flex;
  gap: 3mm;
}

label {
  font-size: 2.2mm;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
}

.info-value {
  font-size: 3.5mm;
  color: #1a1a1a;
  font-weight: 600;
  padding-bottom: 1mm;
  border-bottom: 1.5px solid #b71c1c;
  min-height: 5mm;
  display: flex;
  align-items: center;
}

.footer-pattern {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3mm;
  background: linear-gradient(90deg, #1a1a1a 0%, #b71c1c 50%, #1a1a1a 100%);
  opacity: 0.8;
}

/* Pattern decorativo opzionale per lo sfondo */
.tessera-front::before {
  content: '';
  position: absolute;
  top: -10mm;
  right: -10mm;
  width: 30mm;
  height: 30mm;
  background: radial-gradient(circle, rgba(183, 28, 28, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
}
</style>
