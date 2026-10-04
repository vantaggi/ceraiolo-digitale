<template>
  <div class="tessera-vertical" :style="cardStyle">
    <div
      class="tessera-front"
      :class="{
        'pdf-template': hasPdfTemplate && !backgroundImage,
        'institutional-fallback': !hasPdfTemplate && !backgroundImage
      }"
      :style="{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }"
    >
      <!-- Messaggio PDF Template -->
      <div v-if="hasPdfTemplate && !backgroundImage" class="pdf-template-message">
        <div class="pdf-icon">
          <BaseIcon name="receipt" :size="28" />
        </div>
        <div class="pdf-text">PDF Template<br />Configurato</div>
      </div>

      <!-- Institutional Fallback Header (quando non è caricato un template personalizzato) -->
      <div v-if="!hasPdfTemplate && !backgroundImage" class="institutional-card-header">
        <div class="card-crest">
          <BaseIcon name="shield-check" :size="26" color="gold" />
        </div>
        <div class="card-org-title">FAMIGLIA DEI SANTANTONIARI</div>
        <div class="card-subtitle">GUBBIO</div>
        <div class="card-year-badge">TESSERA SOCIO {{ anno || new Date().getFullYear() }}</div>
      </div>

      <!-- Sezione dati socio -->
      <div class="member-info">
        <div class="info-value name-value">{{ nomeCognome }}</div>
        <div class="info-value birthdate-value">{{ dataNascitaFormattata }}</div>
      </div>

      <!-- Institutional Fallback Footer -->
      <div v-if="!hasPdfTemplate && !backgroundImage" class="institutional-card-footer">
        <div class="card-motto">«In Fide et Honore»</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { formatItalianDOB } from '@/services/export'

const props = defineProps({
  nomeCognome: {
    type: String,
    required: true,
  },
  dataNascita: {
    type: String,
    required: true,
  },
  anno: {
    type: [Number, String],
    default: () => new Date().getFullYear(),
  },
  backgroundImage: {
    type: String,
    default: null,
  },
  hasPdfTemplate: {
    type: Boolean,
    default: false,
  },
  width: {
    type: Number,
    default: 80.77,
  },
  height: {
    type: Number,
    default: 122.17,
  },
})

const dataNascitaFormattata = computed(() => {
  return formatItalianDOB(props.dataNascita)
})

const cardStyle = computed(() => ({
  width: `${props.width}mm`,
  height: `${props.height}mm`,
}))
</script>

<style scoped>
.tessera-vertical {
  width: 80.77mm;
  height: 122.17mm;
  perspective: 1000px;
  font-family: 'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive;
}

.tessera-front {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  justify-content: center;
  align-items: center;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 3mm;
  text-align: center;
  padding: 12mm 5% 12mm 5%;
  width: 100%;
  box-sizing: border-box;
}

.info-value {
  color: #000000;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.name-value {
  font-size: 5mm;
  min-height: 8mm;
  line-height: 1.2;
}

.birthdate-value {
  font-size: 4.5mm;
  min-height: 6mm;
  line-height: 1.1;
}

/* PDF Template Styles */
.pdf-template {
  background-color: var(--color-background);
  border: 2px dashed var(--color-border);
}

.pdf-template-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
  z-index: 1;
}

.pdf-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.pdf-text {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

/* Institutional Fallback (Famiglia dei Santantoniari) */
.institutional-fallback {
  background: linear-gradient(145deg, #fffefb 0%, #f7f3ea 100%) !important;
  border: 3.5px double #b71c1c;
  box-shadow: inset 0 0 0 2px #c59b27, 0 4px 12px rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 8px 6px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.institutional-card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-top: 4px;
}

.card-crest {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3px;
}

.card-org-title {
  font-family: 'Cinzel', 'Georgia', 'Times New Roman', serif;
  font-size: 11px;
  font-weight: 800;
  color: #b71c1c;
  letter-spacing: 0.8px;
  line-height: 1.2;
}

.card-subtitle {
  font-family: 'Cinzel', 'Georgia', 'Times New Roman', serif;
  font-size: 9px;
  font-weight: 700;
  color: #854d0e;
  letter-spacing: 2px;
  margin-top: 1px;
}

.card-year-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  background: #b71c1c;
  color: #ffffff;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-radius: 9999px;
  border: 1px solid #c59b27;
  font-variant-numeric: tabular-nums;
}

.institutional-fallback .member-info {
  padding: 2mm 4% 2mm 4%;
}

.institutional-card-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 4px;
}

.card-motto {
  font-family: 'Cinzel', 'Georgia', 'Times New Roman', serif;
  font-size: 8.5px;
  font-weight: 600;
  font-style: italic;
  color: #78716c;
  letter-spacing: 1px;
}
</style>
