<template>
  <div class="tessera-vertical" :style="cardStyle">
    <div
      class="tessera-front"
      :class="{ 'pdf-template': hasPdfTemplate && !backgroundImage }"
      :style="{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }"
    >
      <!-- Messaggio PDF Template -->
      <div v-if="hasPdfTemplate && !backgroundImage" class="pdf-template-message">
        <div class="pdf-icon">📄</div>
        <div class="pdf-text">PDF Template<br />Configurato</div>
      </div>

      <!-- Sezione dati socio -->
      <div class="member-info">
        <div class="info-value name-value">{{ nomeCognome }}</div>
        <div class="info-value birthdate-value">{{ dataNascitaFormattata }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  nomeCognome: {
    type: String,
    required: true,
  },
  dataNascita: {
    type: String,
    required: true,
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

const mesi = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
]

const dataNascitaFormattata = computed(() => {
  if (!props.dataNascita) return ''
  const [anno, mese, giorno] = props.dataNascita.split('-')
  const meseNome = mesi[parseInt(mese) - 1]
  return `${parseInt(giorno)} ${meseNome} ${anno}`
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
  font-family: cursive;
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
  background-color: #f5f5f5;
  border: 2px dashed #ccc;
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
  font-size: 24px;
  margin-bottom: 8px;
}

.pdf-text {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}
</style>
