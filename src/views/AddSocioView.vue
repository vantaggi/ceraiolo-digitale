<template>
  <div class="add-socio">
    <div class="form-container">
      <!-- Header -->
      <div class="form-header">
        <router-link to="/" class="back-link">← Torna alla ricerca</router-link>
        <h1>+ Nuovo Socio</h1>
      </div>

      <!-- Form -->
      <form @submit.prevent="submitSocio" class="socio-form">
        <!-- Nome e Cognome in riga singola -->
        <div class="form-row">
          <div class="form-group">
            <label for="nome">
              <span class="field-icon">👤</span>
              Nome
            </label>
            <input
              id="nome"
              ref="nomeInput"
              v-model="formData.nome"
              type="text"
              required
              class="form-input"
              placeholder="Inserisci il nome"
            />
          </div>

          <div class="form-group">
            <label for="cognome">
              <span class="field-icon">📝</span>
              Cognome
            </label>
            <input
              id="cognome"
              v-model="formData.cognome"
              type="text"
              required
              class="form-input"
              placeholder="Inserisci il cognome"
            />
          </div>
        </div>

        <!-- Data e luogo nascita -->
        <div class="form-row">
          <div class="form-group">
            <label for="data-nascita">
              <span class="field-icon">🎂</span>
              Data di Nascita
            </label>
            <input
              id="data-nascita"
              v-model="formData.data_nascita"
              type="date"
              required
              class="form-input"
              :max="today"
            />
          </div>

          <div class="form-group">
            <label for="luogo-nascita">
              <span class="field-icon">📍</span>
              Luogo di Nascita
            </label>
            <input
              id="luogo-nascita"
              v-model="formData.luogo_nascita"
              type="text"
              required
              class="form-input"
              placeholder="Inserisci il luogo di nascita"
            />
          </div>
        </div>

        <!-- Gruppo appartenenza -->
        <div class="form-group">
          <label for="gruppo-appartenenza">
            <span class="field-icon">👥</span>
            Gruppo di Appartenenza
          </label>
          <select
            id="gruppo-appartenenza"
            v-model="formData.gruppo_appartenenza"
            required
            class="form-input"
          >
            <option value="" disabled>Seleziona un gruppo</option>
            <option v-for="group in availableGroups" :key="group" :value="group">
              {{ group }}
            </option>
            <option value="Nuovo">+ Nuovo Gruppo...</option>
          </select>
        </div>

        <!-- Campo nuovo gruppo (se selezionato "Nuovo Gruppo") -->
        <div v-if="formData.gruppo_appartenenza === 'Nuovo'" class="form-group">
          <label for="nuovo-gruppo">
            <span class="field-icon">✨</span>
            Nome Nuovo Gruppo
          </label>
          <input
            id="nuovo-gruppo"
            v-model="newGroupName"
            type="text"
            required
            class="form-input"
            placeholder="Inserisci il nome del nuovo gruppo"
          />
        </div>

        <!-- Anno prima iscrizione (opzionale) -->
        <div class="form-group">
          <label for="data-prima-iscrizione">
            <span class="field-icon">📅</span>
            Anno Prima Iscrizione (opzionale)
          </label>
          <input
            id="data-prima-iscrizione"
            v-model.number="formData.data_prima_iscrizione"
            type="number"
            class="form-input"
            placeholder="Anno (es: 2020)"
            min="1900"
            :max="currentYear"
          />
        </div>

        <!-- Note -->
        <div class="form-group">
          <label for="note">
            <span class="field-icon">📝</span>
            Note (opzionale)
          </label>
          <textarea
            id="note"
            v-model="formData.note"
            class="form-textarea"
            rows="3"
            placeholder="Aggiungi eventuali note..."
          ></textarea>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <router-link to="/" class="cancel-button">Annulla</router-link>
          <button type="submit" class="save-button" :disabled="isSubmitting">
            {{ isSubmitting ? '💾 Salvando...' : '👤 Salva Nuovo Socio' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { addSocio, getUniqueGroups, getSetting } from '@/services/db'

const router = useRouter()
const availableGroups = ref([])
const newGroupName = ref('')
const isSubmitting = ref(false)
const nomeInput = ref(null) // Ref per autofocus

const today = new Date().toISOString().split('T')[0]
const currentYear = new Date().getFullYear()

const formData = reactive({
  nome: '',
  cognome: '',
  data_nascita: '',
  luogo_nascita: '',
  gruppo_appartenenza: '',
  data_prima_iscrizione: '',
  note: ''
})

// Carica i dati settings all'avvio
onMounted(async () => {
    try {
        const defaultCity = await getSetting('defaultCity', 'Gubbio')
        if (defaultCity) {
            formData.luogo_nascita = defaultCity
        }
    } catch (e) {
        console.warn("Could not load default city", e)
    }

    await loadGroups()

    // Smart Focus
    if (nomeInput.value) {
        nomeInput.value.focus()
    }

    window.addEventListener('keydown', handleKeydown)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

const handleKeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        submitSocio()
    }
}

// Carica i gruppi disponibili
const loadGroups = async () => {
  try {
    const groups = await getUniqueGroups()
    availableGroups.value = groups
  } catch (error) {
    console.error('Errore nel caricamento dei gruppi:', error)
    availableGroups.value = []
  }
}

// Gestisci la selezione del nuovo gruppo
watch(() => formData.gruppo_appartenenza, (newValue) => {
  if (newValue !== 'Nuovo') {
    newGroupName.value = ''
  }
})

// Gestisci il valore del nuovo gruppo
watch(newGroupName, (newValue) => {
  if (newValue && formData.gruppo_appartenenza === 'Nuovo') {
    formData.gruppo_appartenenza = newValue.trim()
  }
})

const validateForm = () => {
  if (!formData.nome.trim()) {
    alert('Inserire il nome')
    return false
  }

  if (!formData.cognome.trim()) {
    alert('Inserire il cognome')
    return false
  }

  if (!formData.data_nascita) {
    alert('Selezionare una data di nascita valida')
    return false
  }

  if (!formData.luogo_nascita.trim()) {
    alert('Inserire il luogo di nascita')
    return false
  }

  if (!formData.gruppo_appartenenza || formData.gruppo_appartenenza === 'Nuovo') {
    alert('Selezionare un gruppo valido')
    return false
  }

  // Validazione data di nascita: non futura
  const birthDate = new Date(formData.data_nascita)
  const now = new Date()
  if (birthDate > now) {
    alert('La data di nascita non può essere futura')
    return false
  }

  return true
}

const submitSocio = async () => {
  if (isSubmitting.value) return

  if (!validateForm()) return

  isSubmitting.value = true

  try {
    // Prepara i dati per il salvataggio
    const socioData = {
      nome: formData.nome.trim(),
      cognome: formData.cognome.trim(),
      data_nascita: formData.data_nascita,
      luogo_nascita: formData.luogo_nascita.trim(),
      gruppo_appartenenza: formData.gruppo_appartenenza.trim(),
      note: formData.note.trim()
    }

    // Aggiungi anno prima iscrizione se fornito
    if (formData.data_prima_iscrizione) {
      socioData.data_prima_iscrizione = parseInt(formData.data_prima_iscrizione)
    }

    // Salva il nuovo socio
    const socioId = await addSocio(socioData)

    alert('Nuovo socio aggiunto con successo!')

    // Reindirizza alla pagina di dettaglio del nuovo socio
    router.push({ name: 'socio-detail', params: { id: socioId } })

  } catch (error) {
    console.error('Errore nel salvataggio del socio:', error)
    alert('Errore durante il salvataggio: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Carica i dati al mount
onMounted(() => {
  loadGroups()
})
</script>

<style scoped>
.add-socio {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.form-container {
  background-color: var(--color-surface);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: var(--shadow-md);
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 3px solid var(--color-accent);
}

.back-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  align-self: flex-start;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-accent);
}

.form-header h1 {
  margin: 0;
  color: var(--color-primary);
  font-size: 2rem;
}

.socio-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-icon {
  font-size: 1.2rem;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: var(--font-family-body);
  transition: all 0.2s;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-text-secondary);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s;
}

.cancel-button:hover {
  background-color: #666;
  transform: translateY(-1px);
}

.save-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button:hover:not(:disabled) {
  background-color: #a22a2a;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(183, 28, 28, 0.3);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 768px) {
  .add-socio {
    padding: 1rem;
  }

  .form-container {
    padding: 2rem;
  }

  .form-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
  }

  .form-header h1 {
    font-size: 1.5rem;
  }

  .socio-form {
    gap: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-button,
  .save-button {
    width: 100%;
    text-align: center;
  }
}

/* Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.socio-form {
  animation: slideInUp 0.4s ease-out;
}
</style>
