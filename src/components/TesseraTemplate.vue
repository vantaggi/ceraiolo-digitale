<template>
  <div class="tessera-vertical">
    <div
      class="tessera-front"
      :style="{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }"
    >
      <!-- Sezione dati socio -->
      <div class="member-info">
        <div class="info-value name">{{ nomeCognome }}</div>
        <div class="info-value birthdate">{{ dataNascitaFormattata }}</div>
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
  padding: 5mm 5% 5mm 5%;
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
}

.info-value {
  font-size: 6mm;
  color: #000000;
  font-weight: 600;
  min-height: 8mm;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
