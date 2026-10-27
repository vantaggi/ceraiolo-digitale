<template>
  <div class="add-socio">
    <PageHeader title="Nuovo socio" back-to="/" back-label="Soci" />

    <form class="form-container" novalidate @submit.prevent="submitSocio">
      <ModuloSocio
        ref="modulo"
        v-model:dati="formData"
        id-prefisso="nuovo-socio"
        :manicchie="availableGroups"
        :soci="sociInArchivio"
        :mostra-errori="tentato"
        :disabilitato="isSubmitting"
      />

      <div class="form-actions">
        <RouterLink to="/" class="annulla">Annulla</RouterLink>
        <BaseButton type="submit" variant="primary" :loading="isSubmitting">
          <AppIcon name="nuovo-socio" /> Salva nuovo socio
        </BaseButton>
      </div>
      <p class="scorciatoia">Ctrl+S salva.</p>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { db, addSocio, getUniqueGroups, getSetting, addCustomGroup } from '@/services/db'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import ModuloSocio from '@/components/ModuloSocio.vue'
import { datiDaSalvare } from '@/utils/socio'

const router = useRouter()
const toast = useToast()
const availableGroups = ref([])
const sociInArchivio = ref([])
const isSubmitting = ref(false)
const tentato = ref(false)
const modulo = ref(null)

const formData = reactive({
  nome: '',
  cognome: '',
  data_nascita: '',
  luogo_nascita: '',
  gruppo_appartenenza: '',
  data_prima_iscrizione: '',
  note: '',
})

const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    submitSocio()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  modulo.value?.primoCampo()
  try {
    formData.luogo_nascita = await getSetting('defaultCity', 'Gubbio')
  } catch (e) {
    console.warn('Citta predefinita non letta', e)
  }
  try {
    availableGroups.value = await getUniqueGroups()
    sociInArchivio.value = await db.soci.toArray()
  } catch (error) {
    console.error('Errore nel caricamento di manicchie e soci:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const submitSocio = async () => {
  if (isSubmitting.value) return
  tentato.value = true
  if (modulo.value?.vaiAlPrimoErrore()) return

  isSubmitting.value = true
  try {
    const socioData = datiDaSalvare(formData)

    // Una manicchia nuova entra anche nella lista delle manicchie
    const manicchia = socioData.gruppo_appartenenza
    if (manicchia && !availableGroups.value.includes(manicchia)) {
      try {
        await addCustomGroup(manicchia)
      } catch (err) {
        console.warn('Manicchia nuova non aggiunta alla lista', err)
      }
    }

    const socioId = await addSocio(socioData)
    toast.success('Nuovo socio aggiunto')
    router.push({ name: 'socio-detail', params: { id: socioId } })
  } catch (error) {
    console.error('Errore nel salvataggio del socio:', error)
    toast.error('Socio non salvato: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.add-socio {
  max-width: var(--page-width-form);
  margin: 0 auto;
  padding: var(--space-32);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
  padding: var(--space-32);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-16);
  padding-top: var(--space-16);
  border-top: 1px solid var(--color-border);
}

.annulla {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.scorciatoia {
  margin: 0;
  text-align: right;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

@media (max-width: 600px) {
  .add-socio {
    padding: var(--space-16);
  }

  .form-container {
    padding: var(--space-16);
  }
}
</style>
