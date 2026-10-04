<template>
  <div class="reports-view">
    <div class="container reports-layout">
      <!-- Sidebar -->
      <aside class="reports-sidebar">
        <h1 class="sidebar-title">
          <BaseIcon name="bar-chart" :size="22" color="accent" />
          <span>Report</span>
        </h1>
        <nav class="reports-nav">
          <button
            @click="currentTab = 'rinnovi'"
            :class="{ active: currentTab === 'rinnovi' }"
            class="nav-item"
          >
            <BaseIcon name="calendar" :size="18" />
            <span>Rinnovi & Tessere</span>
          </button>
          <button
            @click="currentTab = 'liste'"
            :class="{ active: currentTab === 'liste' }"
            class="nav-item"
          >
            <BaseIcon name="clipboard" :size="18" />
            <span>Elenchi Dati</span>
          </button>
          <button
            @click="currentTab = 'export'"
            :class="{ active: currentTab === 'export' }"
            class="nav-item"
          >
            <BaseIcon name="package" :size="18" />
            <span>Export Batch</span>
          </button>
          <button
            @click="currentTab = 'stats'"
            :class="{ active: currentTab === 'stats' }"
            class="nav-item"
          >
            <BaseIcon name="trending-up" :size="18" />
            <span>Statistiche</span>
          </button>
          <button
            @click="currentTab = 'audit-quote'"
            :class="{ active: currentTab === 'audit-quote' }"
            class="nav-item"
          >
            <BaseIcon name="scale" :size="18" />
            <span>Audit Quote (Rientri)</span>
          </button>
          <hr style="border: 0; border-top: 1px solid var(--color-border); margin: 10px 0;" />
          <button
            @click="openPdfLab"
            class="nav-item pdf-lab-nav-btn"
            :class="{ active: currentTab === 'rinnovi' && isPdfLabExpanded }"
          >
            <BaseIcon name="sliders" :size="18" color="accent" />
            <span>PDF Lab</span>
          </button>
        </nav>
      </aside>

      <!-- Content -->
      <main class="reports-content">
        <!-- GLOBAL HEADER & CONTROLS -->
        <section class="report-section header-section">
          <div class="header-row">
            <h2>
              <BaseIcon name="bar-chart" :size="24" color="accent" />
              <span>{{ getTabTitle(currentTab) }}</span>
            </h2>
            <div class="year-selector-inline">
              <label for="renewalYear">Anno di Riferimento:</label>
              <input
                id="renewalYear"
                v-model.number="renewalYear"
                type="number"
                :min="2000"
                :max="currentYear + 5"
                class="year-input"
              />
            </div>
          </div>
        </section>

        <!-- TAB: RINNOVI & TESSERE (HUB STAMPE UNIFICATO) -->
        <div v-if="currentTab === 'rinnovi'">
          <!-- 4 QUICK 1-CLICK PRINT CARDS -->
          <div class="reports-grid quick-cards-grid">
            <!-- 1. Rinnovi con arretrati -->
            <section class="report-card">
              <div class="card-header-icon">
                <BaseIcon name="clipboard" :size="22" color="accent" />
                <h3>Rinnovi con Arretrati</h3>
              </div>
              <p>Tabella PDF con soci ed elenco quote arretrate per l'anno {{ renewalYear }}.</p>
              <button
                @click="generateRenewalList"
                :disabled="!renewalYear || loading"
                class="action-button"
              >
                <BaseIcon v-if="loading" name="loader" spin :size="16" />
                <BaseIcon v-else name="download" :size="16" />
                <span>{{ loading ? 'Generazione...' : 'Scarica PDF Rinnovi' }}</span>
              </button>
            </section>

            <!-- 2. Ceraioli da sollecitare (Churn) -->
            <section class="report-card">
              <div class="card-header-icon">
                <BaseIcon name="trending-down" :size="22" color="warning" />
                <h3>Ceraioli da Sollecitare</h3>
              </div>
              <p>Soci attivi nel {{ renewalYear - 1 }} ma non ancora in regola nell'anno {{ renewalYear }}.</p>
              <button
                @click="generateChurnReport"
                :disabled="!renewalYear || loading"
                class="action-button"
              >
                <BaseIcon v-if="loading" name="loader" spin :size="16" />
                <BaseIcon v-else name="download" :size="16" />
                <span>{{ loading ? 'Generazione...' : 'Scarica PDF Solleciti' }}</span>
              </button>
            </section>

            <!-- 3. Fogli tessere 6x -->
            <section class="report-card">
              <div class="card-header-icon">
                <BaseIcon name="ticket" :size="22" color="gold" />
                <h3>Fogli Tessere 6x</h3>
              </div>
              <p>Stampa tessere (6 per foglio A4) pronte per il taglio.</p>

              <div class="card-options-compact">
                <div class="sort-selector-row">
                  <label for="cardSortOrder" class="compact-label">Ordinamento:</label>
                  <select id="cardSortOrder" v-model="cardSortBy" class="small-input" :disabled="loading">
                    <option value="manicchia">Per Manicchia (Mazzetti)</option>
                    <option value="alfabetico">Alfabetico (A-Z)</option>
                  </select>
                </div>

                <div class="filter-mini">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="excludeInactiveMembers" :disabled="loading" />
                    <span class="checkmark"></span>
                    Escludi inattivi (&gt;5 anni)
                  </label>
                  <small
                    v-if="excludeInactiveMembers"
                    style="display: block; margin-top: 4px; color: var(--color-text-secondary)"
                  >
                    Attivi: {{ sociStats.active }} / {{ sociStats.total }}
                  </small>
                </div>
              </div>

              <div v-if="cardProgress > 0" class="progress-bar-mini">
                <div class="fill" :style="{ width: cardProgress + '%' }"></div>
              </div>

              <button
                @click="generateCards6x"
                :disabled="!renewalYear || loading"
                class="action-button"
              >
                <BaseIcon v-if="loading" name="loader" spin :size="16" />
                <BaseIcon v-else name="printer" :size="16" />
                <span>{{ loading ? 'Generazione...' : 'Stampa Tessere 6x' }}</span>
              </button>
            </section>

            <!-- 4. Resoconto cassa blocchetti -->
            <section class="report-card">
              <div class="card-header-icon">
                <BaseIcon name="coins" :size="22" color="success" />
                <h3>Resoconto Cassa Blocchetti</h3>
              </div>
              <p>Riepilogo incassi per libretto, ricevute utilizzate e stato assegnatari per il {{ renewalYear }}.</p>
              <button
                @click="generateBookletSummary"
                :disabled="!renewalYear || loading"
                class="action-button"
              >
                <BaseIcon v-if="loading" name="loader" spin :size="16" />
                <BaseIcon v-else name="download" :size="16" />
                <span>{{ loading ? 'Generazione...' : 'Scarica Resoconto Cassa' }}</span>
              </button>
            </section>
          </div>

          <!-- EXPANDABLE "PDF LAB" SECTION -->
          <section id="pdf-lab-section" class="report-section pdf-lab-accordion" style="margin-top: 2rem;">
            <div class="pdf-lab-header" @click="isPdfLabExpanded = !isPdfLabExpanded">
              <div class="pdf-lab-title">
                <BaseIcon name="sliders" :size="22" color="accent" />
                <h3>PDF Lab — Query Builder Avanzato & Generatore Dinamico</h3>
              </div>
              <button
                type="button"
                class="accordion-toggle-btn"
                :aria-expanded="isPdfLabExpanded"
                @click.stop="isPdfLabExpanded = !isPdfLabExpanded"
              >
                <BaseIcon :name="isPdfLabExpanded ? 'chevron-up' : 'chevron-down'" :size="20" />
              </button>
            </div>

            <div v-show="isPdfLabExpanded" class="pdf-lab-body">
              <!-- Presets section -->
              <div class="pdf-lab-subcard presets-subcard">
                <div class="subcard-header">
                  <div class="title-with-icon">
                    <BaseIcon name="bookmark" :size="18" color="gold" />
                    <h4>Preset di Ricerca Salvati</h4>
                  </div>
                  <button @click="savePreset" class="btn-success-small">
                    <BaseIcon name="plus" :size="14" /> Salva Nuova Vista
                  </button>
                </div>

                <div v-if="savedPresets.length > 0" class="presets-chip-container">
                  <div v-for="(preset, index) in savedPresets" :key="index" class="preset-chip">
                    <span class="preset-name" @click="loadPreset(preset)" title="Clicca per applicare questo preset">
                      {{ preset.name }}
                    </span>
                    <span class="preset-divider"></span>
                    <button @click="deletePreset(index)" class="preset-delete-btn" title="Elimina Preset">
                      <BaseIcon name="trash-2" :size="14" color="accent" />
                    </button>
                  </div>
                </div>
                <div v-else class="empty-hint">
                  Nessun preset salvato. Configura filtri e colonne, poi clicca "Salva Nuova Vista" per riutilizzarli in futuro.
                </div>
              </div>

              <!-- Active Filter Chips Bar & Reset -->
              <div class="active-filters-bar" :class="{ 'has-active': totalActiveFilterCount > 0 }">
                <div class="active-chips-left">
                  <div class="active-title">
                    <BaseIcon name="sliders" :size="16" color="accent" />
                    <strong>Filtri Attivi:</strong>
                    <span v-if="totalActiveFilterCount > 0" class="active-count-badge">{{ totalActiveFilterCount }}</span>
                    <span v-else class="text-muted" style="font-weight: normal; font-size: 0.85rem;">(Tutti i soci inclusi)</span>
                  </div>
                  <div v-if="activeFilterChips.length > 0" class="active-chips-list">
                    <div v-for="chip in activeFilterChips" :key="chip.id" class="filter-chip-item">
                      <span class="chip-text">{{ chip.label }}</span>
                      <button type="button" @click="chip.clear()" class="chip-dismiss-btn" title="Rimuovi questo filtro">
                        <BaseIcon name="x" :size="12" />
                      </button>
                    </div>
                  </div>
                </div>
                <div class="active-chips-right">
                  <button @click="resetFilters" class="btn-secondary-small reset-all-btn" :disabled="totalActiveFilterCount === 0">
                    <BaseIcon name="rotate-ccw" :size="14" /> Ripristina Filtri
                  </button>
                </div>
              </div>

              <!-- Riassunto Filtri Attivi in linguaggio naturale -->
              <div class="filter-summary-card">
                <div class="summary-label">
                  <BaseIcon name="info" :size="16" color="info" />
                  <strong>Riassunto Criteri di Ricerca:</strong>
                </div>
                <p class="summary-text">{{ activeFiltersSummary }}</p>
              </div>

              <!-- STUDIO A 2 PILASTRI: 1. CHI SELEZIONARE VS 2. COME IMPAGINARE -->
              <div class="pdf-lab-studio-grid">
                
                <!-- PILASTRO 1: CRITERI DI SELEZIONE SOCI -->
                <div class="studio-pillar pillar-filters">
                  <div class="pillar-header">
                    <div class="pillar-title">
                      <BaseIcon name="sliders" :size="18" color="accent" />
                      <h4>1. Criteri di Selezione Soci</h4>
                    </div>
                    <span class="pillar-badge" v-if="totalActiveFilterCount > 0">{{ totalActiveFilterCount }} attivi</span>
                    <span class="pillar-badge-muted" v-else>Tutti i Soci</span>
                  </div>

                  <!-- Tabs di Categoria -->
                  <div class="category-tabs-bar">
                    <button
                      type="button"
                      class="category-tab-btn"
                      :class="{ active: activeFilterCategory === 'anagrafica' }"
                      @click="activeFilterCategory = 'anagrafica'"
                    >
                      <BaseIcon name="user" :size="16" />
                      <span>Anagrafica</span>
                      <span v-if="anagraficaFilterCount > 0" class="tab-count-badge">{{ anagraficaFilterCount }}</span>
                    </button>
                    <button
                      type="button"
                      class="category-tab-btn"
                      :class="{ active: activeFilterCategory === 'cassa' }"
                      @click="activeFilterCategory = 'cassa'"
                    >
                      <BaseIcon name="credit-card" :size="16" />
                      <span>Cassa & Storico</span>
                      <span v-if="cassaFilterCount > 0" class="tab-count-badge">{{ cassaFilterCount }}</span>
                    </button>
                    <button
                      type="button"
                      class="category-tab-btn"
                      :class="{ active: activeFilterCategory === 'elezioni' }"
                      @click="activeFilterCategory = 'elezioni'"
                    >
                      <BaseIcon name="check-square" :size="16" />
                      <span>Elezioni</span>
                      <span v-if="elezioniFilterCount > 0" class="tab-count-badge">{{ elezioniFilterCount }}</span>
                    </button>
                  </div>

                  <!-- Tab Panel: Anagrafica & Territorio -->
                  <div v-show="activeFilterCategory === 'anagrafica'" class="category-tab-panel">
                    <!-- Attivi 5 anni toggle card -->
                    <div class="filter-toggle-card">
                      <label class="checkbox-label font-bold">
                        <input type="checkbox" v-model="reportState.filters.onlyActiveMembers" />
                        <span class="checkmark"></span>
                        Solo Soci Attivi (con almeno 1 quota negli ultimi 5 anni)
                      </label>
                      <span class="toggle-hint">Esclude i membri non rinnovati dal {{ statutoryMinYear }} in poi</span>
                    </div>

                    <!-- Fascia d'Età Segmented -->
                    <div class="filter-field-block">
                      <label class="field-block-label">Fascia d'Età:</label>
                      <div class="segmented-control">
                        <button
                          type="button"
                          class="segment-btn"
                          :class="{ active: reportState.filters.ageGroup === 'all' }"
                          @click="reportState.filters.ageGroup = 'all'"
                        >Tutti</button>
                        <button
                          type="button"
                          class="segment-btn"
                          :class="{ active: reportState.filters.ageGroup === 'maggiorenni' }"
                          @click="reportState.filters.ageGroup = 'maggiorenni'"
                        >Solo Maggiorenni (18+)</button>
                        <button
                          type="button"
                          class="segment-btn"
                          :class="{ active: reportState.filters.ageGroup === 'minorenni' }"
                          @click="reportState.filters.ageGroup = 'minorenni'"
                        >Solo Minorenni (&lt; 18)</button>
                      </div>
                    </div>

                    <!-- Manicchie Multiselect -->
                    <div class="filter-field-block">
                      <div class="field-block-header">
                        <label class="field-block-label">Manicchia di Appartenenza:</label>
                        <div class="quick-links">
                          <button type="button" @click="selectAllGroups" class="link-btn">[ Tutte ]</button>
                          <button type="button" @click="deselectAllGroups" class="link-btn text-muted">[ Deseleziona ]</button>
                        </div>
                      </div>
                      <div class="checkbox-chips">
                        <label v-for="group in availableGroups" :key="'filter-group-' + group" class="checkbox-label chip-label">
                          <input type="checkbox" :value="group" v-model="reportState.filters.groups" />
                          <span class="checkmark"></span>
                          {{ group }}
                        </label>
                      </div>
                      <span v-if="reportState.filters.groups.length === 0" class="empty-hint">Nessuna manicchia selezionata = mostra tutte</span>
                    </div>
                  </div>

                  <!-- Tab Panel: Cassa & Storico -->
                  <div v-show="activeFilterCategory === 'cassa'" class="category-tab-panel">
                    <!-- Stato Pagamento per l'anno -->
                    <div class="filter-field-block">
                      <label class="field-block-label">Stato Pagamento Quota {{ renewalYear || currentYear }}:</label>
                      <div class="segmented-control">
                        <button
                          type="button"
                          class="segment-btn"
                          :class="{ active: reportState.filters.paymentStatus === 'all' }"
                          @click="reportState.filters.paymentStatus = 'all'"
                        >Tutti i Soci</button>
                        <button
                          type="button"
                          class="segment-btn status-ok-btn"
                          :class="{ active: reportState.filters.paymentStatus === 'in_regola' }"
                          @click="reportState.filters.paymentStatus = 'in_regola'"
                        >In Regola (Quota Pagata)</button>
                        <button
                          type="button"
                          class="segment-btn status-warn-btn"
                          :class="{ active: reportState.filters.paymentStatus === 'morosi' }"
                          @click="reportState.filters.paymentStatus = 'morosi'"
                        >Morosi (Da Saldare)</button>
                      </div>
                    </div>

                    <!-- Anni di Pagamento AND / OR -->
                    <div class="filter-field-block">
                      <div class="field-block-header">
                        <label class="field-block-label">Filtra per Anni di Pagamento Specifici:</label>
                        <div class="quick-links" v-if="reportState.filters.paymentYears.list.length > 0">
                          <button type="button" @click="reportState.filters.paymentYears.list = []" class="link-btn text-muted">[ Azzera Anni ]</button>
                        </div>
                      </div>
                      <div class="checkbox-chips">
                        <label v-for="year in availableYears" :key="'filter-year-' + year" class="checkbox-label chip-label">
                          <input type="checkbox" :value="year" v-model="reportState.filters.paymentYears.list" />
                          <span class="checkmark"></span>
                          {{ year }}
                        </label>
                      </div>
                      <div v-if="reportState.filters.paymentYears.list.length > 0" class="logic-selector-box">
                        <label class="radio-label">
                          <input type="radio" value="AND" v-model="reportState.filters.paymentYears.logic" />
                          <span class="radiomark"></span>
                          AND (ha pagato in <strong>tutti</strong> gli anni selezionati)
                        </label>
                        <label class="radio-label">
                          <input type="radio" value="OR" v-model="reportState.filters.paymentYears.logic" />
                          <span class="radiomark"></span>
                          OR (ha pagato in <strong>almeno uno</strong> degli anni)
                        </label>
                      </div>
                      <span v-else class="empty-hint">Nessun anno specifico selezionato = nessun vincolo storico</span>
                    </div>
                  </div>

                  <!-- Tab Panel: Elezioni & Voto -->
                  <div v-show="activeFilterCategory === 'elezioni'" class="category-tab-panel">
                    <div class="filter-field-block">
                      <div class="filter-group-grid">
                        <div class="f-group">
                          <label class="field-block-label">Data Riferimento Elezioni:</label>
                          <input type="date" v-model="reportState.filters.electionDate" class="small-input" />
                        </div>
                        <div class="f-group">
                          <label class="field-block-label">Filtro Aventi Diritto:</label>
                          <select v-model="reportState.filters.electionEligibility" class="small-input">
                            <option value="all">Mostra Tutti (Senza Filtro)</option>
                            <option value="aventi_diritto">Solo Aventi Diritto (Sì + Regolarizza)</option>
                            <option value="solo_si">Aventi Diritto (Solo 'Sì')</option>
                            <option value="solo_regolarizza">Da Regolarizzare (Solo 'Regolarizza')</option>
                            <option value="esclusi">Esclusi (Solo 'No')</option>
                          </select>
                        </div>
                      </div>
                      <span class="toggle-hint">Statuto: diritto di voto riservato ai soci maggiorenni con quote in regola negli ultimi 5 anni.</span>
                    </div>
                  </div>
                </div>

                <!-- PILASTRO 2: IMPAGINAZIONE & COLONNE -->
                <div class="studio-pillar pillar-layout">
                  <div class="pillar-header">
                    <div class="pillar-title">
                      <BaseIcon name="file-spreadsheet" :size="18" color="gold" />
                      <h4>2. Impaginazione & Colonne</h4>
                    </div>
                    <span class="pillar-badge">{{ reportState.display.baseColumns.length + sortedYearColumns.length }} colonne</span>
                  </div>

                  <!-- Colonne Anagrafiche -->
                  <div class="layout-field-block">
                    <label class="field-block-label">Colonne Anagrafiche da Includere:</label>
                    <div class="columns-selection-grid">
                      <label class="checkbox-label chip-label">
                        <input type="checkbox" value="cognomeNome" v-model="reportState.display.baseColumns" />
                        <span class="checkmark"></span>
                        Socio
                      </label>
                      <label class="checkbox-label chip-label">
                        <input type="checkbox" value="gruppo" v-model="reportState.display.baseColumns" />
                        <span class="checkmark"></span>
                        Manicchia
                      </label>
                      <label class="checkbox-label chip-label">
                        <input type="checkbox" value="dataNascita" v-model="reportState.display.baseColumns" />
                        <span class="checkmark"></span>
                        Data Nascita
                      </label>
                      <label class="checkbox-label chip-label">
                        <input type="checkbox" value="eta" v-model="reportState.display.baseColumns" />
                        <span class="checkmark"></span>
                        Età
                      </label>
                      <label class="checkbox-label chip-label">
                        <input type="checkbox" value="dirittoVoto" v-model="reportState.display.baseColumns" />
                        <span class="checkmark"></span>
                        Avente Diritto
                      </label>
                      <label class="checkbox-label chip-label">
                        <input type="checkbox" value="motivoEsclusione" v-model="reportState.display.baseColumns" />
                        <span class="checkmark"></span>
                        Motivo Esclusione
                      </label>
                      <label class="checkbox-label chip-label">
                        <input type="checkbox" value="firma" v-model="reportState.display.baseColumns" />
                        <span class="checkmark"></span>
                        Spazio Firma
                      </label>
                    </div>

                    <!-- Riordino orizzontale colonne -->
                    <div v-if="reportState.display.baseColumns.length > 1" class="column-order-container">
                      <div class="column-order-header-mini">
                        <BaseIcon name="sliders" :size="14" />
                        <span>Sequenza colonne nel PDF:</span>
                      </div>
                      <div class="column-order-pills-row">
                        <div v-for="(col, index) in reportState.display.baseColumns" :key="col" class="column-order-pill">
                          <button
                            type="button"
                            @click="moveColumn(index, -1)"
                            :disabled="index === 0"
                            class="col-move-btn"
                            title="Sposta a sinistra"
                          >
                            <BaseIcon name="chevron-left" :size="12" />
                          </button>
                          <span class="col-pill-name">{{ colName(col) }}</span>
                          <button
                            type="button"
                            @click="moveColumn(index, 1)"
                            :disabled="index === reportState.display.baseColumns.length - 1"
                            class="col-move-btn"
                            title="Sposta a destra"
                          >
                            <BaseIcon name="chevron-right" :size="12" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Colonne Anni Storici (V/X) -->
                  <div class="layout-field-block">
                    <div class="field-block-header">
                      <label class="field-block-label">Colonne Storico Quote (V/X):</label>
                      <div class="quick-links">
                        <button type="button" @click="selectAllYearColumns" class="link-btn">[ Tutte ]</button>
                        <button type="button" @click="deselectAllYearColumns" class="link-btn text-muted">[ Nessuna ]</button>
                      </div>
                    </div>
                    <div class="checkbox-chips">
                      <label v-for="year in availableYears" :key="'col-year-' + year" class="checkbox-label chip-label">
                        <input type="checkbox" :value="year" v-model="reportState.display.yearColumns" />
                        <span class="checkmark"></span>
                        {{ year }}
                      </label>
                    </div>
                  </div>

                  <!-- Ordinamento -->
                  <div class="layout-field-block sort-block">
                    <label class="field-block-label">Ordinamento Righe:</label>
                    <div class="sort-inline-controls">
                      <select v-model="reportState.sort.by" class="small-input">
                        <option value="cognome">Per Cognome (A-Z)</option>
                        <option value="gruppo">Per Manicchia</option>
                        <option value="anno_nascita">Per Anno di Nascita</option>
                      </select>
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="reportState.sort.descending" />
                        <span class="checkmark"></span>
                        Ordine Decrescente
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ACTION & STATUS BAR SOTTO I DUE PILASTRI -->
              <div class="pdf-lab-action-bar shadow-sm">
                <div class="action-bar-stats">
                  <div class="stat-badge">
                    <BaseIcon name="users" :size="16" />
                    <span>Soci Filtrati: <strong>{{ processedData.length }}</strong></span>
                  </div>
                  <div class="stat-badge">
                    <BaseIcon name="file-text" :size="16" />
                    <span>Colonne: <strong>{{ reportState.display.baseColumns.length + sortedYearColumns.length }}</strong></span>
                  </div>
                </div>
                <div class="action-bar-actions">
                  <button @click="handleDynamicExport" class="primary-button export-pdf-btn" :disabled="loading">
                    <BaseIcon v-if="loading" name="loader" spin :size="18" />
                    <BaseIcon v-else name="download" :size="18" />
                    <span>{{ loading ? 'Generazione PDF in corso...' : 'Genera PDF Dinamico' }}</span>
                  </button>
                </div>
              </div>

              <!-- REACTIVE LIVE PREVIEW TABLE -->
              <div class="live-preview-section">
                <div class="preview-header-bar">
                  <div class="title-with-icon">
                    <BaseIcon name="eye" :size="18" />
                    <h4>Anteprima Dati Reattiva (Risultati: {{ processedData.length }})</h4>
                  </div>
                  <div class="legend-badges">
                    <span class="legend-title">Legenda:</span>
                    <div><span class="status-badge badge-success">V</span> Pagato</div>
                    <div><span class="status-badge badge-error">X</span> Non Pagato</div>
                    <div><span class="status-badge badge-warning">O</span> Minorenne/Esente</div>
                    <div><span class="status-badge badge-blue">-</span> Non Iscritto</div>
                  </div>
                </div>

                <div v-if="processedData.length > 0" class="audit-preview senior-preview-wrapper">
                  <table class="preview-table senior-table">
                    <thead>
                      <tr>
                        <th
                          v-for="col in reportState.display.baseColumns"
                          :key="'th-' + col"
                          :style="col === 'dirittoVoto' ? 'text-align: center;' : ''"
                        >
                          {{ colName(col) }}
                        </th>
                        <th
                          v-for="year in sortedYearColumns"
                          :key="'th-year-' + year"
                          style="text-align: center;"
                        >
                          {{ year }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="member in processedData.slice(0, 30)" :key="member.id">
                        <td
                          v-for="col in reportState.display.baseColumns"
                          :key="'td-' + col + '-' + member.id"
                          :style="col === 'dirittoVoto' ? 'text-align: center;' : ''"
                        >
                          <template v-if="col === 'cognomeNome'">
                            <strong>{{ member.cognome }}</strong> {{ member.nome }}
                          </template>
                          <template v-else-if="col === 'gruppo'">
                            {{ member.gruppo_appartenenza || '-' }}
                          </template>
                          <template v-else-if="col === 'dataNascita'">
                            {{ formatDate(member.data_nascita) }}
                          </template>
                          <template v-else-if="col === 'eta'">
                            <span class="badge-subtle">{{ getAgeLabel(member.data_nascita) }}</span>
                          </template>
                          <template v-else-if="col === 'dirittoVoto'">
                            <span class="status-badge" :class="getEligibilityClass(member.aventeDiritto)">
                              {{ member.dirittoLabel }}
                            </span>
                          </template>
                          <template v-else-if="col === 'motivoEsclusione'">
                            <small class="text-secondary">{{ member.motivoEsclusione || '-' }}</small>
                          </template>
                          <template v-else-if="col === 'firma'">
                            <span class="signature-line-blank"></span>
                          </template>
                        </td>
                        <td
                          v-for="year in sortedYearColumns"
                          :key="'td-year-' + year + '-' + member.id"
                          style="text-align: center;"
                        >
                          <span class="status-badge" :class="getYearBadgeClass(member, year)">
                            {{ getYearBadgeText(member, year) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-if="processedData.length > 30" class="more-rows-notice">
                    ... e altri {{ processedData.length - 30 }} membri ...
                  </div>
                </div>
                <div v-else class="empty-state-preview">
                  Nessun membro corrisponde ai criteri selezionati.
                </div>
              </div>
            </div>
          </section>

          <!-- Anteprima Tessera Singola (Tipografica) -->
          <section class="report-section" style="margin-top: 2rem">
            <div class="card-header-icon">
              <BaseIcon name="eye" :size="20" />
              <h3>Anteprima Tessera</h3>
            </div>
            <div class="preview-wrapper">
              <div class="preview-container">
                <TesseraTemplate
                  :nome-cognome="previewData.nomeCognome"
                  :data-nascita="previewData.dataNascita"
                  :anno="renewalYear || currentYear + 1"
                  :background-image="cardBackground"
                  :has-pdf-template="hasPdfTemplate"
                />
              </div>
              <div class="preview-inputs">
                <label>Nome:</label>
                <input v-model="previewData.nomeCognome" class="small-input" />
                <label>Data:</label>
                <input v-model="previewData.dataNascita" type="date" class="small-input" />
              </div>
            </div>
          </section>
        </div>

        <!-- TAB: STATISTICHE -->
        <div v-if="currentTab === 'stats'">
          <!-- Demografia -->
          <section class="report-section">
            <h2>
              <BaseIcon name="trending-up" :size="22" color="accent" />
              <span>Demografia Soci {{ renewalYear }}</span>
            </h2>
            <div class="stats-summary" v-if="demographics">
              <div class="stat-card total">
                <h3>Totale Soci</h3>
                <div class="big-number">{{ demographics.total }}</div>
              </div>

              <div class="stat-card">
                <h3>Distribuzione Età</h3>
                <div class="chart-container">
                  <div
                    v-for="(count, label) in demographics.ageGroups"
                    :key="label"
                    class="chart-row"
                  >
                    <span class="chart-label">{{ label }}</span>
                    <div class="chart-bar-bg">
                      <div
                        class="chart-bar-fill"
                        :style="{ width: (count / demographics.total) * 100 + '%' }"
                      ></div>
                    </div>
                    <span class="chart-value">{{ count }}</span>
                  </div>
                </div>
              </div>

              <div class="stat-card">
                <h3>Luogo di Nascita (Top 10)</h3>
                <div class="chart-container">
                  <div v-for="(count, label) in demographics.places" :key="label" class="chart-row">
                    <span class="chart-label">{{ label }}</span>
                    <div class="chart-bar-bg">
                      <div
                        class="chart-bar-fill"
                        :style="{ width: (count / demographics.total) * 100 + '%' }"
                      ></div>
                    </div>
                    <span class="chart-value">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="no-data">
              <p>Clicca "Analizza" per generare le statistiche.</p>
              <button @click="loadStats" class="action-button">
                <BaseIcon name="bar-chart" :size="16" />
                <span>Analizza Dati {{ renewalYear }}</span>
              </button>
            </div>
          </section>

          <!-- Andamento Economico -->
          <section class="report-section" v-if="economicStats">
            <h2>
              <BaseIcon name="coins" :size="22" color="gold" />
              <span>Andamento Economico {{ renewalYear }}</span>
            </h2>
            <div class="stats-summary">
              <div class="stat-card totalHighlight">
                <h3>Entrate Totali</h3>
                <div class="big-number">€ {{ economicStats.totalRevenue.toFixed(2) }}</div>
                <small>{{ economicStats.totalPayments }} pagamenti registrati</small>

                <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 1rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                     <span>Rinnovi Standard (10€):</span>
                     <strong>€ {{ economicStats.totalStandardQuotas.toFixed(2) }}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                     <span>Nuovi / Rientri (25€+):</span>
                     <strong>€ {{ economicStats.totalPenaltyQuotas.toFixed(2) }}</strong>
                  </div>
                  <div v-if="economicStats.otherQuotas > 0" style="display: flex; justify-content: space-between;">
                     <span>Altre Quote:</span>
                     <strong>€ {{ economicStats.otherQuotas.toFixed(2) }}</strong>
                  </div>
                </div>
              </div>

              <div class="stat-card">
                <h3>Quota Media</h3>
                <div class="big-number">€ {{ economicStats.averageQuota }}</div>
              </div>

              <div class="stat-card">
                <h3>Entrate per Manicchia</h3>
                <div class="chart-container">
                  <div
                    v-for="(revenue, group) in economicStats.groupBreakdown"
                    :key="group"
                    class="chart-row"
                  >
                    <span class="chart-label">{{ group }}</span>
                    <div class="chart-bar-bg">
                      <div
                        class="chart-bar-fill money"
                        :style="{
                          width: (revenue / economicStats.totalRevenue) * 100 + '%',
                        }"
                      ></div>
                    </div>
                    <span class="chart-value">€ {{ revenue }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- TAB: LISTE DATI -->
        <div v-if="currentTab === 'liste'">
          <h2>
            <BaseIcon name="clipboard" :size="22" color="accent" />
            <span>Elenchi e Statistiche</span>
          </h2>

          <!-- Nuovi Soci -->
          <section class="report-section">
            <div class="card-header-icon">
              <BaseIcon name="user-plus" :size="20" color="accent" />
              <h3>Nuovi Soci</h3>
            </div>
            <div class="filters-inline">
              <label>Anno: <strong>{{ renewalYear }}</strong></label>
              <AgeCategoryFilter v-model="newMembersFilters.ageCategory" />
            </div>
            <button @click="generateNewMembersList" :disabled="loading" class="action-button wide">
              <BaseIcon name="file-text" :size="16" />
              <span>Genera Report Nuovi Soci</span>
            </button>
          </section>

          <!-- Soci per Manicchia -->
          <section class="report-section">
            <div class="card-header-icon">
              <BaseIcon name="users" :size="20" color="accent" />
              <h3>Soci per Manicchia</h3>
            </div>
            <div class="filters-grid-compact">
              <div class="f-group">
                <label>Manicchia:</label>
                <select v-model="groupFilters.gruppo" class="small-input">
                  <option value="">Tutti</option>
                  <option v-for="group in availableGroups" :key="group" :value="group">
                    {{ group }}
                  </option>
                </select>
              </div>
              <div class="f-group">
                <label>Età:</label>
                <AgeCategoryFilter v-model="groupFilters.ageCategory" />
              </div>
              <div class="f-group">
                <label>Stato ({{ renewalYear }}):</label>
                <select v-model="groupFilters.paymentStatus" class="small-input">
                  <option value="tutti">Tutti</option>
                  <option value="in_regola">In Regola</option>
                  <option value="non_in_regola">Non in Regola</option>
                </select>
              </div>
            </div>
            <button @click="generateMembersByGroup" :disabled="loading" class="action-button wide">
              <BaseIcon name="file-text" :size="16" />
              <span>Genera Report Manicchie</span>
            </button>
          </section>

          <!-- Riepilogo Numerico Manicchie -->
          <section class="report-section">
            <div class="card-header-icon">
              <BaseIcon name="hash" :size="20" color="accent" />
              <h3>Riepilogo Numerico Manicchie</h3>
            </div>
            <p>Genera un foglio unico con il conteggio degli iscritti per ogni manicchia.</p>
            <div class="filters-inline">
              <label>Anno Riferimento: <strong>{{ renewalYear }}</strong></label>
            </div>
            <button
              @click="generateGroupCountsReport"
              :disabled="loading"
              class="action-button wide"
            >
              <BaseIcon name="bar-chart" :size="16" />
              <span>Genera Riepilogo Numerico</span>
            </button>
          </section>

          <!-- Lista Recupero (Arretrati) -->
          <section class="report-section">
            <div class="card-header-icon">
              <BaseIcon name="trending-down" :size="20" color="warning" />
              <h3>Lista Recupero (Churn)</h3>
            </div>
            <p>
              Soci che hanno pagato l'anno scorso ({{ renewalYear - 1 }}) ma non ancora quest'anno
              ({{ renewalYear }}).
            </p>
            <button @click="generateChurnReport" :disabled="loading" class="action-button wide">
              <BaseIcon name="file-text" :size="16" />
              <span>Genera Lista Recupero</span>
            </button>
          </section>

          <!-- Report Votazioni -->
          <section class="report-section">
            <div class="card-header-icon">
              <BaseIcon name="check-square" :size="20" color="accent" />
              <h3>Report Votazioni</h3>
            </div>
            <p>
              Elenco soci aventi diritto al voto per l'anno <strong>{{ renewalYear }}</strong>.
              <br />
              <small>Requisiti: Maggiorenni nel {{ renewalYear }} (nati &lt;= {{ renewalYear - 18 }}) e in regola con il {{ renewalYear - 1 }}.</small>
            </p>
            <button @click="generateVotingReport" :disabled="loading" class="action-button wide">
              <BaseIcon name="file-text" :size="16" />
              <span>Genera Lista Votazioni</span>
            </button>
          </section>

          <!-- Report Soci Attivi 5 Anni -->
          <section class="report-section">
            <div class="card-header-icon">
              <BaseIcon name="users" :size="20" color="gold" />
              <h3>Report Soci Attivi (5 Anni)</h3>
            </div>
            <p>
              Elenco soci con <strong>almeno 1 pagamento</strong> negli ultimi 5 anni (${{
                renewalYear - 4
              }}
              - {{ renewalYear }}).
            </p>
            <button
              @click="generateActiveMembersReport"
              :disabled="loading"
              class="action-button wide"
            >
              <BaseIcon name="file-text" :size="16" />
              <span>Genera Lista Attivi</span>
            </button>
          </section>

          <!-- Lista Pagamenti -->
          <section class="report-section">
            <div class="card-header-icon">
              <BaseIcon name="coins" :size="20" color="success" />
              <h3>Cronologia Pagamenti</h3>
            </div>
            <div class="filters-inline">
              <AgeCategoryFilter v-model="paymentsFilters.ageCategory" />
            </div>
            <button
              @click="generateCompletePaymentsList"
              :disabled="loading"
              class="action-button wide"
            >
              <BaseIcon name="file-text" :size="16" />
              <span>Genera Report Completo Pagamenti</span>
            </button>
          </section>

          <!-- Audit Dati -->
          <section class="report-section">
            <div class="card-header-icon">
              <BaseIcon name="shield-check" :size="20" color="accent" />
              <h3>Audit Qualità Dati</h3>
            </div>
            <p>Verifica la completezza e coerenza dei dati anagrafici.</p>

            <button @click="runDataAudit" class="action-button wide" :disabled="loading">
              <BaseIcon name="search" :size="16" />
              <span>Esegui Controllo</span>
            </button>

            <div v-if="auditResults" class="audit-box">
              <div v-if="auditResults.summary.total_issues === 0" class="success-message">
                <BaseIcon name="check-circle" :size="18" color="success" />
                <span>Nessuna anomalia rilevata! Il database è perfetto.</span>
              </div>
              <div v-else>
                <div class="audit-stats">
                  <span v-if="auditResults.summary.missing_dob" class="stat-tag">
                    <BaseIcon name="alert-triangle" :size="14" color="warning" /> No Data Nascita: <b>{{ auditResults.summary.missing_dob }}</b>
                  </span>
                  <span v-if="auditResults.summary.missing_pob" class="stat-tag">
                    <BaseIcon name="alert-triangle" :size="14" color="warning" /> No Luogo Nascita: <b>{{ auditResults.summary.missing_pob }}</b>
                  </span>
                  <span v-if="auditResults.summary.missing_reg_date" class="stat-tag">
                    <BaseIcon name="alert-triangle" :size="14" color="warning" /> No Data Iscrizione: <b>{{ auditResults.summary.missing_reg_date }}</b>
                  </span>
                  <span v-if="auditResults.summary.missing_group" class="stat-tag">
                    <BaseIcon name="alert-triangle" :size="14" color="warning" /> No Manicchia: <b>{{ auditResults.summary.missing_group }}</b>
                  </span>
                  <span v-if="auditResults.summary.future_reg" class="stat-tag">
                    <BaseIcon name="alert-triangle" :size="14" color="warning" /> Date Future: <b>{{ auditResults.summary.future_reg }}</b>
                  </span>
                  <span v-if="auditResults.summary.invalid_reg_date" class="stat-tag">
                    <BaseIcon name="alert-triangle" :size="14" color="warning" /> Iscrizioni Illogiche: <b>{{ auditResults.summary.invalid_reg_date }}</b>
                  </span>
                </div>
                <p class="audit-info">
                  Trovate <b>{{ auditResults.summary.total_issues }}</b> anomalie totali.
                </p>

                <!-- Simple table preview -->
                <div class="audit-preview">
                  <table>
                    <thead>
                      <tr>
                        <th>Socio</th>
                        <th>Problemi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in auditResults.details.slice(0, 5)" :key="item.id">
                        <td>{{ item.cognome }} {{ item.nome }}</td>
                        <td>{{ item.issues.join(', ') }}</td>
                      </tr>
                      <tr v-if="auditResults.details.length > 5">
                        <td colspan="2">...e altri {{ auditResults.details.length - 5 }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  @click="generateAuditPDFReport"
                  class="action-button wide secondary"
                  style="margin-top: 1rem"
                >
                  <BaseIcon name="download" :size="16" />
                  <span>Scarica Report Anomalie PDF</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- TAB: EXPORT -->
        <div v-if="currentTab === 'export'">
          <section class="report-section">
            <h2>
              <BaseIcon name="package" :size="22" color="accent" />
              <span>Esportazione Complessiva</span>
            </h2>
            <p>Genera e scarica tutti i report configurati in un'unica operazione.</p>

            <div class="batch-box">
              <ul>
                <li>Lista Rinnovi ({{ renewalYear }})</li>
                <li>Nuovi Soci ({{ renewalYear }})</li>
                <li>Lista Pagamenti</li>
                <li>Soci per Manicchia ({{ renewalYear }})</li>
                <li>Riepilogo Numerico Gruppi ({{ renewalYear }})</li>
              </ul>
              <button @click="generateAllReports" :disabled="loading" class="action-button wide">
                <BaseIcon v-if="loading" name="loader" spin :size="18" />
                <BaseIcon v-else name="download" :size="18" />
                <span>{{ loading ? 'Generazione in corso...' : 'SCARICA TUTTI I REPORT' }}</span>
              </button>
            </div>
          </section>
        </div>

        <!-- TAB: AUDIT QUOTE (RIENTRI) -->
        <div v-if="currentTab === 'audit-quote'">
          <section class="report-section">
            <h2>
              <BaseIcon name="scale" :size="22" color="accent" />
              <span>Report Controllo Quote: Nuovi Iscritti & Rientri</span>
            </h2>
            <p>
              I Nuovi Iscritti e chi riprende a pagare dopo aver saltato un anno (Rientri) devono versare una quota di <b>25€</b>.
              Questo strumento controlla gli ultimi anni (e.g. 2024, 2025, 2026) per individuare chi è rientrato ma a cui sono stati erroneamente registrati solo 10€.
            </p>

            <div class="filters-inline">
              <label>Anno Base: <strong>{{ renewalYear }}</strong> <small>(Controlla pagamenti di quest'anno o degli anni passati)</small></label>
            </div>

            <button @click="runQuotaAuditTask" class="action-button wide" :disabled="loading">
              <BaseIcon name="search" :size="16" />
              <span>Esegui Controllo Quote</span>
            </button>

            <!-- Risultati Audit Quote -->
            <div v-if="auditQuotaResults" class="audit-box" style="margin-top: 2rem;">
              <div v-if="auditQuotaResults.length === 0" class="success-message">
                <BaseIcon name="check-circle" :size="18" color="success" />
                <span>Nessuna anomalia trovata! Tutte le quote dei rientri per l'anno {{ renewalYear }} sono corrette.</span>
              </div>
              <div v-else>
                <div class="audit-stats">
                  <span class="stat-tag" style="background: var(--color-danger); color: white;">
                    <BaseIcon name="alert-triangle" :size="16" color="white" />
                    <span>Rilevate <b>{{ auditQuotaResults.length }}</b> anomalie di versamento</span>
                  </span>
                </div>

                <div class="audit-preview" style="margin-top: 1rem;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
                        <th style="padding: 10px;">Socio</th>
                        <th style="padding: 10px;">Anno Rientro</th>
                        <th style="padding: 10px;">Quota Pagata</th>
                        <th style="padding: 10px;">Ricevuta / Blocchetto</th>
                        <th style="padding: 10px;">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in auditQuotaResults" :key="item.tesseramento.id" style="border-bottom: 1px solid var(--color-border);">
                        <td style="padding: 10px;">
                          <router-link :to="`/socio/${item.socio.id}`" style="color: var(--color-primary); font-weight: bold;">
                            {{ item.socio.cognome }} {{ item.socio.nome }}
                          </router-link>
                        </td>
                        <td style="padding: 10px; font-weight: bold;">{{ item.tesseramento.anno }}</td>
                        <td style="padding: 10px; color: var(--color-danger); font-weight: bold;">
                          € {{ Number(item.tesseramento.quota_pagata || 0).toFixed(2) }}
                        </td>
                        <td style="padding: 10px;">
                          {{ item.tesseramento.numero_ricevuta || '-' }} / {{ item.tesseramento.numero_blocchetto || '-' }}
                        </td>
                        <td style="padding: 10px;">
                          <span style="font-size: 0.85em; color: var(--color-text-secondary);">
                            {{ item.reason }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="audit-actions" style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                  <button @click="exportAuditQuotaPDF" class="action-button secondary" :disabled="loading">
                    <BaseIcon name="download" :size="16" />
                    <span>Esporta PDF</span>
                  </button>
                  <button @click="exportAuditQuotaExcel" class="action-button secondary" :disabled="loading">
                    <BaseIcon name="file-spreadsheet" :size="16" />
                    <span>Esporta Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import BaseIcon from '@/components/common/BaseIcon.vue'
import {
  generateRenewalListPDF,
  generateAllCardsPDF,
  generateNewMembersPDF,
  generateCompletePaymentListPDF,
  generateMembersByGroupPDF,
  generateGroupCountsPDF,
  generateChurnPDF,
  generateAuditPDF,
  generateVotingListPDF,
  generateActiveMembersPDF,
  generateAuditQuotaPDF,
  generateBookletSummaryPDF,
} from '@/services/export'
import { generateBetaDynamicPDF } from '@/services/exportBeta'
import { exportToExcel } from '@/services/excelExport'
import {
  getAllSociWithTesseramenti,
  getNewMembersByYear,
  getCompletePaymentList,
  getMembersByGroup,
  getUniqueGroups,
  getGroupCountsForYear,
  getChurnList,
  getDemographicStats,
  getEconomicStats,
  getDataAuditStats,
  getVotingEligibleMembers,
  getActiveMembersLast5Years,
  getSetting,
  getQuotaAuditList,
  getAllBlocchetti,
  exportAllTesseramenti,
} from '@/services/db'
import TesseraTemplate from '@/components/TesseraTemplate.vue'
import AgeCategoryFilter from '@/components/AgeCategoryFilter.vue'

// Stato del componente
const currentTab = ref('rinnovi')
const renewalYear = ref(new Date().getFullYear())
const loading = ref(false)
const loadingMessage = ref('')
const cardProgress = ref(0)
const auditResults = ref(null)
const auditQuotaResults = ref(null)
const demographics = ref(null)
const economicStats = ref(null)
const cardBackground = ref(null)
const hasPdfTemplate = ref(false)
const excludeInactiveMembers = ref(false)
const cardSortBy = ref('manicchia')
const isPdfLabExpanded = ref(false)
const availableGroups = ref([])
const allMembers = ref([])
const savedPresets = ref([])

const sociStats = reactive({
  total: 0,
  active: 0,
  inactive: 0,
})

const reportState = reactive({
  filters: {
    onlyActiveMembers: false,
    groups: [],
    ageGroup: 'all',
    paymentStatus: 'all',
    electionDate: new Date().toISOString().split('T')[0],
    electionEligibility: 'all',
    paymentYears: {
      list: [],
      logic: 'AND',
    },
  },
  display: {
    baseColumns: ['cognomeNome', 'gruppo', 'dataNascita', 'eta'],
    yearColumns: [],
  },
  sort: {
    by: 'cognome',
    descending: false,
  },
})

// Toast notifications
const toast = useToast()

// Dati per la preview della tessera
const previewData = ref({
  nomeCognome: 'Mario Rossi',
  dataNascita: '1980-05-15',
})

const currentYear = new Date().getFullYear()
const statutoryMinYear = currentYear - 5

// Filters for new members
const newMembersFilters = reactive({
  year: currentYear,
  ageCategory: 'tutti',
})

// Filters for complete payments list
const paymentsFilters = reactive({
  ageCategory: 'tutti',
})

// Filters for members by group
const groupFilters = reactive({
  gruppo: '',
  ageCategory: 'tutti',
  paymentStatus: 'tutti',
})

// Year for group counts report
// REPLACED BY GLOBAL RENEWAL YEAR

onMounted(async () => {
  try {
    loadPresetsFromStorage()
    availableGroups.value = await getUniqueGroups()
    const savedBackground = await getSetting('cardBackground')
    const savedPdfTemplate = await getSetting('cardTemplatePDF')
    if (savedPdfTemplate) {
      hasPdfTemplate.value = true
      cardBackground.value = savedBackground || null
    } else if (savedBackground) {
      cardBackground.value = savedBackground
      hasPdfTemplate.value = false
    } else {
      cardBackground.value = null
      hasPdfTemplate.value = false
    }
    allMembers.value = await getAllSociWithTesseramenti()
    await updateSociStats()
  } catch (error) {
    console.error('Errore caricamento dati:', error)
    toast.error('Errore nel caricamento dei dati')
  }
})

/**
 * Determina se un socio è attivo (ha pagato negli ultimi 5 anni)
 * @param {Object} socio - Oggetto socio con tesseramenti
 * @returns {boolean} True se attivo, false se inattivo
 */
const isSocioActive = (socio) => {
  if (!socio.tesseramenti || socio.tesseramenti.length === 0) {
    return false // Nessun pagamento mai fatto
  }

  const currentYear = new Date().getFullYear()
  const fiveYearsAgo = currentYear - 5

  // Trova l'anno più recente di pagamento
  const latestPaymentYear = Math.max(...socio.tesseramenti.map((t) => t.anno))

  return latestPaymentYear >= fiveYearsAgo
}

/**
 * Aggiorna le statistiche dei soci (totale, attivi, inattivi)
 */
const updateSociStats = async () => {
  try {
    const allSoci = (await getAllSociWithTesseramenti()) || []
    sociStats.total = allSoci.length
    sociStats.active = allSoci.filter(isSocioActive).length
    sociStats.inactive = sociStats.total - sociStats.active
  } catch (error) {
    console.error('Errore calcolo statistiche soci:', error)
    sociStats.total = 0
    sociStats.active = 0
    sociStats.inactive = 0
  }
}

/**
 * Genera la lista nuovi soci
 */
const generateNewMembersList = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati nuovi soci...'
    toast.info('Caricamento dati nuovi soci...')

    const newMembers = await getNewMembersByYear(renewalYear.value, newMembersFilters.ageCategory)

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF nuovi soci...')

    const result = await generateNewMembersPDF(
      newMembers,
      renewalYear.value,
      newMembersFilters.ageCategory,
    )

    if (result.success) {
      toast.success(`PDF Nuovi Soci generato con successo! (${result.totalMembers} soci)`)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione lista nuovi soci:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera la lista completa pagamenti
 */
const generateCompletePaymentsList = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati pagamenti...'
    toast.info('Caricamento dati pagamenti...')

    const payments = await getCompletePaymentList(paymentsFilters.ageCategory)

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF lista pagamenti...')

    const result = await generateCompletePaymentListPDF(payments, paymentsFilters.ageCategory)

    if (result.success) {
      toast.success(
        `PDF Lista Pagamenti generato con successo! (${result.totalPayments} pagamenti)`,
      )
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione lista completa pagamenti:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera la lista soci per manicchia
 */
const generateMembersByGroup = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati soci per manicchia...'
    toast.info('Caricamento dati soci per manicchia...')

    const members = await getMembersByGroup(
      groupFilters.gruppo || null,
      groupFilters.ageCategory,
      groupFilters.paymentStatus,
      renewalYear.value,
    )

    console.log('Members found for PDF generation:', members.length, members)

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF soci per manicchia...')

    const result = await generateMembersByGroupPDF(
      members,
      groupFilters.gruppo,
      groupFilters.ageCategory,
      groupFilters.paymentStatus,
      renewalYear.value,
    )

    if (result.success) {
      toast.success(`PDF Soci per Manicchia generato con successo! (${result.totalMembers} soci)`)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione soci per manicchia:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera il report riepilogativo numerico per manicchie
 */
const generateGroupCountsReport = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Calcolo totali per manicchia...'
    toast.info('Calcolo dati in corso...')

    const counts = await getGroupCountsForYear(renewalYear.value)

    if (counts.length === 0) {
      toast.warning(`Nessun tesseramento trovato per l'anno ${renewalYear.value}`)
      return
    }

    loadingMessage.value = 'Generazione PDF...'
    const result = await generateGroupCountsPDF(counts, renewalYear.value)

    if (result.success) {
      toast.success(`Report generato con successo! (${result.totalGroups} manicchie censite)`)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione riepilogo manicchie:', error)
    toast.error('Errore: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera tutti i report in un'unica operazione
 */
const generateAllReports = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Generazione report multipli...'
    toast.info('Inizio generazione report multipli...')

    // Genera tutti i report in sequenza
    const reports = []

    // 1. Lista Rinnovi (se anno configurato)
    if (renewalYear.value) {
      loadingMessage.value = 'Generazione lista rinnovi...'
      const soci = await getAllSociWithTesseramenti()
      await generateRenewalListPDF(soci, renewalYear.value)
      reports.push('Lista Rinnovi')
    }

    // 2. Nuovi Soci
    loadingMessage.value = 'Generazione nuovi soci...'
    const newMembers = await getNewMembersByYear(renewalYear.value, newMembersFilters.ageCategory)
    const newMembersResult = await generateNewMembersPDF(
      newMembers,
      renewalYear.value,
      newMembersFilters.ageCategory,
    )
    if (newMembersResult.success) reports.push('Nuovi Soci')

    // 3. Lista Completa Pagamenti
    loadingMessage.value = 'Generazione lista pagamenti...'
    const payments = await getCompletePaymentList(paymentsFilters.ageCategory)
    const paymentsResult = await generateCompletePaymentListPDF(
      payments,
      paymentsFilters.ageCategory,
    )
    if (paymentsResult.success) reports.push('Lista Pagamenti')

    // 4. Soci per Manicchia
    loadingMessage.value = 'Generazione soci per manicchia...'
    const members = await getMembersByGroup(
      groupFilters.gruppo || null,
      groupFilters.ageCategory,
      groupFilters.paymentStatus,
      renewalYear.value,
    )
    const membersResult = await generateMembersByGroupPDF(
      members,
      groupFilters.gruppo,
      groupFilters.ageCategory,
      groupFilters.paymentStatus,
      renewalYear.value,
    )
    if (membersResult.success) reports.push('Soci per Manicchia')

    // 5. Riepilogo Manicchie
    loadingMessage.value = 'Generazione riepilogo manicchie...'
    const counts = await getGroupCountsForYear(renewalYear.value)
    if (counts.length > 0) {
      const countsResult = await generateGroupCountsPDF(counts, renewalYear.value)
      if (countsResult.success) reports.push('Riepilogo Manicchie')
    }

    toast.success(`Generati ${reports.length} report: ${reports.join(', ')}`)
  } catch (error) {
    console.error('Errore generazione report multipli:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}


/**
 * Genera la lista rinnovi in formato PDF
 */
const generateRenewalList = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati soci...'
    toast.info('Caricamento dati soci...')

    const soci = await getAllSociWithTesseramenti()

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF in corso...')
    await generateRenewalListPDF(soci, renewalYear.value)

    toast.success('PDF Lista Rinnovi generato con successo!')
  } catch (error) {
    console.error('Errore generazione lista rinnovi:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera il report Recupero Crediti (Churn)
 */
const generateChurnReport = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Analisi mancati rinnovi...'
    toast.info('Calcolo lista recupero...')

    const churnList = await getChurnList(renewalYear.value)

    if (churnList.length === 0) {
      toast.success(
        `Nessun socio da recuperare per il ${renewalYear.value}! (Tutti hanno pagato o sono nuovi)`,
      )
      return
    }

    loadingMessage.value = 'Generazione PDF...'
    const result = await generateChurnPDF(churnList, renewalYear.value)

    if (result.success) {
      toast.success(`Lista Recupero generata! (${result.count} soci da contattare)`)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione churn report:', error)
    toast.error('Errore: ' + error.message)
  } finally {
    loading.value = false
  }
}

/**
 * Genera il report per le votazioni
 */
const generateVotingReport = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Ricerca aventi diritto...'
    toast.info('Calcolo aventi diritto al voto...')

    const eligibleMembers = await getVotingEligibleMembers(renewalYear.value)

    if (eligibleMembers.length === 0) {
      toast.warning(`Nessun socio avente diritto trovato per il ${renewalYear.value}`)
      return
    }

    loadingMessage.value = 'Generazione PDF...'
    await generateVotingListPDF(eligibleMembers, renewalYear.value)

    toast.success(`Report Votazioni generato! (${eligibleMembers.length} aventi diritto)`)
  } catch (error) {
    console.error('Errore generazione report votazioni:', error)
    toast.error('Errore: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera il report dei soci attivi (almeno 1 pagamento negli ultimi 5 anni)
 */
const generateActiveMembersReport = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Ricerca soci attivi...'
    toast.info('Calcolo soci attivi...')

    const activeMembers = await getActiveMembersLast5Years(renewalYear.value)

    if (activeMembers.length === 0) {
      toast.warning(
        `Nessun socio attivo trovato negli ultimi 5 anni (fino al ${renewalYear.value})`,
      )
      return
    }

    loadingMessage.value = 'Generazione PDF...'
    await generateActiveMembersPDF(activeMembers, renewalYear.value)

    toast.success(`Report Attivi generato! (${activeMembers.length} soci)`)
  } catch (error) {
    console.error('Errore generazione report attivi:', error)
    toast.error('Errore: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Carica le statistiche demografiche ed economiche per l'anno selezionato
 */
const loadStats = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Analisi dati in corso...'

    // Esegui entrambi in parallelo
    const [demoData, econData] = await Promise.all([
      getDemographicStats(renewalYear.value),
      getEconomicStats(renewalYear.value),
    ])

    demographics.value = demoData
    economicStats.value = econData

    toast.success('Statistiche aggiornate!')
  } catch (error) {
    console.error('Errore caricamento statistiche:', error)
    toast.error('Errore nel calcolo delle statistiche')
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

// Watch per resettare stats se cambia anno
watch(renewalYear, () => {
  if (currentTab.value === 'stats') {
    demographics.value = null
    economicStats.value = null
  }
})

const runDataAudit = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Controllo qualità dati...'

    // Simulate delay
    await new Promise((r) => setTimeout(r, 500))

    const results = await getDataAuditStats()
    auditResults.value = results

    if (results.summary.total_issues === 0) {
      toast.success('Ottimo! Nessuna anomalia trovata.')
    } else {
      toast.warning(`Trovate ${results.summary.total_issues} anomalie nei dati.`)
    }
  } catch (error) {
    console.error(error)
    toast.error('Errore audit: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

const runQuotaAuditTask = async () => {
  if (!renewalYear.value) return
  try {
    loading.value = true
    loadingMessage.value = 'Ricerca anomalie quote (Rientri / Nuovi)...'

    // Simulate delay per UX
    await new Promise((r) => setTimeout(r, 500))

    const results = await getQuotaAuditList(renewalYear.value)
    auditQuotaResults.value = results

    if (results.length === 0) {
      toast.success('Nessuna anomalia trovata! Tutte le quote sono 25€ per i rientri.')
    } else {
      toast.warning(`Trovate ${results.length} quote potenzialmente errate.`)
    }
  } catch (error) {
    console.error('Errore audit quote:', error)
    toast.error('Errore audit quote: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

const exportAuditQuotaPDF = async () => {
  if (!auditQuotaResults.value || auditQuotaResults.value.length === 0) return

  try {
    loading.value = true
    loadingMessage.value = 'Generazione PDF Audit Quote...'

    const result = await generateAuditQuotaPDF(auditQuotaResults.value, renewalYear.value)

    if (result.success) {
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Report PDF scaricato!')
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore export PDF Audit Quote:', error)
    toast.error('Errore generazione PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

const exportAuditQuotaExcel = () => {
  if (!auditQuotaResults.value || auditQuotaResults.value.length === 0) return

  try {
    const data = auditQuotaResults.value.map(item => ({
      'Cognome e Nome': `${item.socio.cognome} ${item.socio.nome}`,
      'Anno Rientro': item.tesseramento.anno,
      'Quota Pagata': `€ ${Number(item.tesseramento.quota_pagata || 0).toFixed(2)}`,
      'Ricevuta': item.tesseramento.numero_ricevuta || '-',
      'Blocchetto': item.tesseramento.numero_blocchetto || '-',
      'Motivazione': item.reason
    }))

    exportToExcel(data, `Audit_Quote_Rientri_${renewalYear.value}`);
    toast.success('File Excel scaricato!')
  } catch (error) {
    console.error('Errore export Excel Audit Quote:', error)
    toast.error('Errore durante l\'export Excel.')
  }
}

const generateAuditPDFReport = async () => {
  if (!auditResults.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Generazione PDF audit...'

    const result = await generateAuditPDF(auditResults.value)

    if (result.success) {
      // Download
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Report Audit scaricato!')
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione audit PDF:', error)
    toast.error('Errore export audit: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}



/**
 * Genera fogli tessere 6x (formato A4 griglia 2x3 con linee di taglio)
 */
const generateCards6x = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    cardProgress.value = 0
    loadingMessage.value = 'Caricamento dati soci...'
    toast.info('Caricamento dati soci...')

    let soci = await getAllSociWithTesseramenti()

    if (excludeInactiveMembers.value) {
      soci = soci.filter(isSocioActive)
    }

    loadingMessage.value = 'Generazione fogli tessere 6x...'
    toast.info('Generazione tessere 6x in corso...')

    const risultati = await generateAllCardsPDF(
      soci,
      renewalYear.value,
      {
        sortBy: cardSortBy.value,
        layout: '6x',
      },
      (progress) => {
        cardProgress.value = progress
      },
    )

    let totalCards = 0
    for (const risultato of risultati) {
      const url = URL.createObjectURL(risultato.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = risultato.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      totalCards += (risultato.count || 0)
    }

    const sortLabel = cardSortBy.value === 'manicchia' ? 'per manicchia' : 'in ordine alfabetico'
    toast.success(`Fogli tessere 6x generati (${totalCards} tessere ${sortLabel})!`)
  } catch (error) {
    console.error('Errore generazione tessere 6x:', error)
    toast.error('Errore nella generazione tessere: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
    cardProgress.value = 0
  }
}

/**
 * Genera il resoconto cassa per i blocchetti ricevute
 */
const generateBookletSummary = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati cassa blocchetti...'
    toast.info('Caricamento dati cassa blocchetti...')

    const [blocchetti, tesseramenti] = await Promise.all([
      getAllBlocchetti(),
      exportAllTesseramenti(),
    ])

    loadingMessage.value = 'Generazione PDF Resoconto Cassa...'
    const result = await generateBookletSummaryPDF(blocchetti, tesseramenti, renewalYear.value)

    if (result && result.success && result.blob) {
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Resoconto Cassa generato con successo per l'anno ${renewalYear.value}!`)
    } else {
      throw new Error(result?.error || 'Errore nella creazione del file PDF')
    }
  } catch (error) {
    console.error('Errore generazione resoconto cassa:', error)
    toast.error('Errore generazione resoconto cassa: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Gestione PDF Lab
 */
const openPdfLab = () => {
  currentTab.value = 'rinnovi'
  isPdfLabExpanded.value = true
}

const loadPresetsFromStorage = () => {
  try {
    const stored = localStorage.getItem('pdf_lab_presets') || localStorage.getItem('reports_beta_presets')
    if (stored) {
      savedPresets.value = JSON.parse(stored)
    }
  } catch (e) {
    console.error('Errore caricamento preset:', e)
  }
}

const savePreset = () => {
  const name = prompt('Scegli un nome per salvare l\'attuale vista PDF (es: "Lista votanti 2024"):')
  if (name && name.trim()) {
    const trimmed = name.trim()
    savedPresets.value.push({
      name: trimmed,
      state: JSON.parse(JSON.stringify(reportState)),
    })
    const serialized = JSON.stringify(savedPresets.value)
    localStorage.setItem('pdf_lab_presets', serialized)
    localStorage.setItem('reports_beta_presets', serialized)
    toast.success(`Preset "${trimmed}" salvato!`)
  }
}

const loadPreset = (preset) => {
  if (preset && preset.state) {
    Object.assign(reportState, JSON.parse(JSON.stringify(preset.state)))
    toast.success(`Preset "${preset.name}" caricato con successo!`)
  }
}

const deletePreset = (index) => {
  if (confirm('Vuoi davvero cancellare definitivamente questo preset?')) {
    savedPresets.value.splice(index, 1)
    const serialized = JSON.stringify(savedPresets.value)
    localStorage.setItem('pdf_lab_presets', serialized)
    localStorage.setItem('reports_beta_presets', serialized)
    toast.info('Preset eliminato')
  }
}

const resetFilters = () => {
  reportState.filters.onlyActiveMembers = false
  reportState.filters.groups = []
  reportState.filters.ageGroup = 'all'
  reportState.filters.paymentStatus = 'all'
  reportState.filters.electionDate = new Date().toISOString().split('T')[0]
  reportState.filters.electionEligibility = 'all'
  reportState.filters.paymentYears.list = []
  reportState.filters.paymentYears.logic = 'AND'
  toast.info('Filtri ripristinati')
}

const selectAllYearColumns = () => {
  reportState.display.yearColumns = [...availableYears.value]
}

const deselectAllYearColumns = () => {
  reportState.display.yearColumns = []
}

const moveColumn = (index, direction) => {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < reportState.display.baseColumns.length) {
    const arr = [...reportState.display.baseColumns]
    const temp = arr[index]
    arr[index] = arr[newIndex]
    arr[newIndex] = temp
    reportState.display.baseColumns = arr
  }
}

const colName = (val) => {
  if (val === 'cognomeNome') return 'Socio'
  if (val === 'gruppo') return 'Manicchia'
  if (val === 'dataNascita') return 'Data Nascita'
  if (val === 'dirittoVoto') return 'Avente Diritto'
  if (val === 'motivoEsclusione') return 'Motivo Esclusione'
  if (val === 'eta') return 'Età'
  if (val === 'firma') return 'Firma'
  return val
}

const hasPaidYear = (member, year) => {
  const paidYears = member.tesseramenti?.map((t) => t.anno) || []
  return paidYears.includes(year)
}

const isMinorInYear = (member, year) => {
  if (!member.data_nascita) return false
  const birthYear = new Date(member.data_nascita).getFullYear()
  return year - birthYear < 18
}

const getEnrollmentYear = (member) => {
  if (member.data_iscrizione) {
    return new Date(member.data_iscrizione).getFullYear()
  }
  const paidYears = member.tesseramenti?.map((t) => t.anno) || []
  if (paidYears.length > 0) return Math.min(...paidYears)
  return new Date().getFullYear()
}

const isEnrolledInYear = (member, year) => {
  return year >= getEnrollmentYear(member)
}

const getYearBadgeText = (member, year) => {
  if (!isEnrolledInYear(member, year)) return '-'
  if (hasPaidYear(member, year)) return 'V'
  if (isMinorInYear(member, year)) return 'O'
  return 'X'
}

const getYearBadgeClass = (member, year) => {
  if (!isEnrolledInYear(member, year)) return 'badge-blue'
  if (hasPaidYear(member, year)) return 'badge-success'
  if (isMinorInYear(member, year)) return 'badge-warning'
  return 'badge-error'
}

const getEligibilityClass = (status) => {
  if (status === 'si') return 'badge-success'
  if (status === 'regolarizza') return 'badge-warning'
  return 'badge-error'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-')
  } catch {
    return dateString
  }
}

const getAgeLabel = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const today = new Date()
    const birthDate = new Date(dateStr)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 18 ? 'Maggiorenne' : 'Minorenne'
  } catch {
    return '-'
  }
}

const availableYears = computed(() => {
  const years = new Set()
  for (let y = currentYear + 1; y >= statutoryMinYear; y--) {
    years.add(y)
  }
  if (Array.isArray(allMembers.value) && allMembers.value.length > 0) {
    allMembers.value.forEach((m) => {
      if (m.tesseramenti) {
        m.tesseramenti.forEach((t) => {
          if (t.anno) years.add(t.anno)
        })
      }
    })
  }
  return Array.from(years).sort((a, b) => b - a)
})

const sortedYearColumns = computed(() => {
  return [...reportState.display.yearColumns].sort((a, b) => a - b)
})

const activeFiltersSummary = computed(() => {
  let summary = 'Stai visualizzando '

  if (reportState.filters.ageGroup === 'maggiorenni') summary += 'i soci maggiorenni '
  else if (reportState.filters.ageGroup === 'minorenni') summary += 'i soci minorenni '
  else summary += 'i soci '

  if (reportState.filters.onlyActiveMembers) summary += 'attivi (con almeno 1 pagamento negli ultimi 5 anni) '

  if (reportState.filters.paymentStatus === 'in_regola') summary += `in regola con il ${renewalYear.value || currentYear} `
  else if (reportState.filters.paymentStatus === 'morosi') summary += `morosi per il ${renewalYear.value || currentYear} `

  if (reportState.filters.groups.length > 0) {
    summary += `appartenenti alle manicchie: [${reportState.filters.groups.join(', ')}] `
  } else {
    summary += 'di tutte le manicchie '
  }

  if (reportState.filters.electionEligibility === 'aventi_diritto') {
    summary += `che hanno diritto al voto (Sì + Regolarizza) alla data ${formatDate(reportState.filters.electionDate)} `
  } else if (reportState.filters.electionEligibility === 'solo_si') {
    summary += `che hanno PIENO diritto al voto ('Sì') alla data ${formatDate(reportState.filters.electionDate)} `
  } else if (reportState.filters.electionEligibility === 'solo_regolarizza') {
    summary += `da REGOLARIZZARE alla data ${formatDate(reportState.filters.electionDate)} `
  } else if (reportState.filters.electionEligibility === 'esclusi') {
    summary += `che NON hanno diritto al voto ('No') alla data ${formatDate(reportState.filters.electionDate)} `
  }

  if (reportState.filters.paymentYears.list.length > 0) {
    const years = [...reportState.filters.paymentYears.list].sort((a, b) => b - a).join(', ')
    const logicStr = reportState.filters.paymentYears.logic === 'AND' ? 'in tutti gli anni elencati' : 'in almeno uno di questi anni'
    summary += `che hanno registrato pagamenti ${logicStr}: (${years}) `
  }

  const sortMap = { cognome: 'Cognome', gruppo: 'Manicchia', anno_nascita: 'Anno di Nascita' }
  const sortDir = reportState.sort.descending ? 'decrescente' : 'crescente'
  summary += `- Ordinati per ${sortMap[reportState.sort.by] || reportState.sort.by} (${sortDir}).`

  return summary.charAt(0).toUpperCase() + summary.slice(1)
})

// Gestione Studio PDF Lab: Categorie Filtri & Active Chips
const activeFilterCategory = ref('anagrafica')

const anagraficaFilterCount = computed(() => {
  let count = 0
  if (reportState.filters.onlyActiveMembers) count++
  if (reportState.filters.ageGroup !== 'all') count++
  if (reportState.filters.groups.length > 0) count += reportState.filters.groups.length
  return count
})

const cassaFilterCount = computed(() => {
  let count = 0
  if (reportState.filters.paymentStatus !== 'all') count++
  if (reportState.filters.paymentYears.list.length > 0) count += reportState.filters.paymentYears.list.length
  return count
})

const elezioniFilterCount = computed(() => {
  let count = 0
  if (reportState.filters.electionEligibility !== 'all') count++
  return count
})

const totalActiveFilterCount = computed(() => {
  return anagraficaFilterCount.value + cassaFilterCount.value + elezioniFilterCount.value
})

const activeFilterChips = computed(() => {
  const chips = []
  if (reportState.filters.onlyActiveMembers) {
    chips.push({
      id: 'active',
      label: 'Solo Attivi (5 anni)',
      clear: () => { reportState.filters.onlyActiveMembers = false }
    })
  }
  if (reportState.filters.ageGroup === 'maggiorenni') {
    chips.push({
      id: 'age-maggiorenni',
      label: 'Fascia: Maggiorenni (18+)',
      clear: () => { reportState.filters.ageGroup = 'all' }
    })
  } else if (reportState.filters.ageGroup === 'minorenni') {
    chips.push({
      id: 'age-minorenni',
      label: 'Fascia: Minorenni (< 18)',
      clear: () => { reportState.filters.ageGroup = 'all' }
    })
  }
  if (reportState.filters.groups.length > 0) {
    reportState.filters.groups.forEach((g) => {
      chips.push({
        id: 'group-' + g,
        label: `Manicchia: ${g}`,
        clear: () => {
          reportState.filters.groups = reportState.filters.groups.filter((x) => x !== g)
        }
      })
    })
  }
  if (reportState.filters.paymentStatus === 'in_regola') {
    chips.push({
      id: 'status-in_regola',
      label: `Cassa ${renewalYear.value || currentYear}: In Regola`,
      clear: () => { reportState.filters.paymentStatus = 'all' }
    })
  } else if (reportState.filters.paymentStatus === 'morosi') {
    chips.push({
      id: 'status-morosi',
      label: `Cassa ${renewalYear.value || currentYear}: Morosi`,
      clear: () => { reportState.filters.paymentStatus = 'all' }
    })
  }
  if (reportState.filters.paymentYears.list.length > 0) {
    const yearsStr = [...reportState.filters.paymentYears.list].sort((a, b) => b - a).join(', ')
    chips.push({
      id: 'years',
      label: `Anni: [${yearsStr}] (${reportState.filters.paymentYears.logic})`,
      clear: () => { reportState.filters.paymentYears.list = [] }
    })
  }
  if (reportState.filters.electionEligibility !== 'all') {
    const map = {
      aventi_diritto: 'Aventi Diritto (Sì + Regolarizza)',
      solo_si: 'Pieno Diritto (Solo Sì)',
      solo_regolarizza: 'Da Regolarizzare',
      esclusi: 'Esclusi (No)',
    }
    chips.push({
      id: 'election',
      label: `Elezioni: ${map[reportState.filters.electionEligibility] || reportState.filters.electionEligibility}`,
      clear: () => { reportState.filters.electionEligibility = 'all' }
    })
  }
  return chips
})

const selectAllGroups = () => {
  reportState.filters.groups = [...availableGroups.value]
}

const deselectAllGroups = () => {
  reportState.filters.groups = []
}

const processedData = computed(() => {
  let result = Array.isArray(allMembers.value) ? [...allMembers.value] : []

  const electionDateStr = reportState.filters.electionDate
  const targetDateObj = new Date(electionDateStr)
  const targetYear = targetDateObj.getFullYear()

  result.forEach((member) => {
    let aventeDiritto = true
    let electionStatus = ''
    let dirittoLabel = ''
    let motivoEsclusione = ''

    if (!member.data_nascita) {
      aventeDiritto = false
      motivoEsclusione = 'Data di nascita mancante'
    } else {
      const birthDateObj = new Date(member.data_nascita)
      let ageAtTarget = targetYear - birthDateObj.getFullYear()
      const m = targetDateObj.getMonth() - birthDateObj.getMonth()
      if (m < 0 || (m === 0 && targetDateObj.getDate() < birthDateObj.getDate())) {
        ageAtTarget--
      }
      if (ageAtTarget < 18) {
        aventeDiritto = false
        motivoEsclusione = 'Minorenne alla data elettorale'
      }
    }

    const paidYears = member.tesseramenti?.map((t) => t.anno) || []
    const enrollmentYear = getEnrollmentYear(member)

    if (aventeDiritto) {
      const windowStart = Math.max(targetYear - 3, enrollmentYear)
      const windowEnd = targetYear
      const recentWindow = []
      for (let y = windowStart; y <= windowEnd; y++) recentWindow.push(y)

      let E = null
      for (const y of recentWindow) {
        if (paidYears.includes(y) || isMinorInYear(member, y)) {
          E = y
          break
        }
      }

      if (E === null) {
        electionStatus = 'no'
        dirittoLabel = 'No'
        if (enrollmentYear > targetYear) {
          motivoEsclusione = `Iscritto postumo (${enrollmentYear})`
        } else {
          motivoEsclusione = `Nessun pagamento registrato o valido nel periodo ${windowStart} - ${windowEnd}`
        }
      } else if (E === targetYear && !isMinorInYear(member, targetYear - 1)) {
        electionStatus = 'no'
        dirittoLabel = 'No'
        if (enrollmentYear === targetYear) {
          motivoEsclusione = `Nuovo iscritto nell'anno ${targetYear}`
        } else {
          motivoEsclusione = `Socio rientrato nell'anno ${targetYear}`
        }
      } else {
        const missingYears = []
        for (let y = E; y <= targetYear; y++) {
          if (!paidYears.includes(y) && !isMinorInYear(member, y)) {
            missingYears.push(y)
          }
        }

        if (missingYears.length === 0) {
          electionStatus = 'si'
          dirittoLabel = 'Sì'
          motivoEsclusione = ''
        } else {
          electionStatus = 'regolarizza'
          dirittoLabel = 'Regolarizza'
          motivoEsclusione = `Mancano quote: ${missingYears.join(', ')}`
        }
      }
    } else {
      electionStatus = 'no'
      dirittoLabel = 'No'
    }

    member.aventeDiritto = electionStatus
    member.dirittoLabel = dirittoLabel
    member.motivoEsclusione = motivoEsclusione
  })

  if (reportState.filters.onlyActiveMembers) {
    result = result.filter((member) => {
      const paidYears = member.tesseramenti?.map((t) => t.anno) || []
      return paidYears.some((year) => year >= statutoryMinYear)
    })
  }

  if (reportState.filters.ageGroup !== 'all') {
    const today = new Date()
    result = result.filter((member) => {
      if (!member.data_nascita) return false
      const birthDate = new Date(member.data_nascita)
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (reportState.filters.ageGroup === 'maggiorenni') return age >= 18
      if (reportState.filters.ageGroup === 'minorenni') return age < 18
      return true
    })
  }

  if (reportState.filters.paymentStatus !== 'all') {
    const curY = renewalYear.value || currentYear
    result = result.filter((member) => {
      const paidYears = member.tesseramenti?.map((t) => t.anno) || []
      const hasYear = paidYears.includes(curY)
      if (reportState.filters.paymentStatus === 'in_regola') return hasYear
      if (reportState.filters.paymentStatus === 'morosi') return !hasYear
      return true
    })
  }

  if (reportState.filters.groups.length > 0) {
    result = result.filter((member) => {
      return reportState.filters.groups.includes(member.gruppo_appartenenza || 'Nessuna Manicchia')
    })
  }

  if (reportState.filters.electionEligibility === 'aventi_diritto') {
    result = result.filter((member) => member.aventeDiritto === 'si' || member.aventeDiritto === 'regolarizza')
  } else if (reportState.filters.electionEligibility === 'solo_si') {
    result = result.filter((member) => member.aventeDiritto === 'si')
  } else if (reportState.filters.electionEligibility === 'solo_regolarizza') {
    result = result.filter((member) => member.aventeDiritto === 'regolarizza')
  } else if (reportState.filters.electionEligibility === 'esclusi') {
    result = result.filter((member) => member.aventeDiritto === 'no')
  }

  if (reportState.filters.paymentYears.list.length > 0) {
    const { list, logic } = reportState.filters.paymentYears
    result = result.filter((member) => {
      const paidYears = member.tesseramenti?.map((t) => t.anno) || []
      if (logic === 'AND') {
        return list.every((reqYear) => paidYears.includes(reqYear))
      } else {
        return list.some((reqYear) => paidYears.includes(reqYear))
      }
    })
  }

  result.sort((a, b) => {
    let comparison = 0
    if (reportState.sort.by === 'cognome') {
      comparison = (a.cognome || '').localeCompare(b.cognome || '')
    } else if (reportState.sort.by === 'gruppo') {
      comparison = (a.gruppo_appartenenza || '').localeCompare(b.gruppo_appartenenza || '')
      if (comparison === 0) comparison = (a.cognome || '').localeCompare(b.cognome || '')
    } else if (reportState.sort.by === 'anno_nascita') {
      const yearA = a.data_nascita ? parseInt(a.data_nascita.split('-')[0]) : 9999
      const yearB = b.data_nascita ? parseInt(b.data_nascita.split('-')[0]) : 9999
      comparison = yearA - yearB
      if (comparison === 0) comparison = (a.cognome || '').localeCompare(b.cognome || '')
    }
    return reportState.sort.descending ? -comparison : comparison
  })

  return result
})

const handleDynamicExport = async () => {
  if (processedData.value.length === 0) {
    toast.warning('Nessun dato da esportare.')
    return
  }
  if (reportState.display.baseColumns.length === 0 && reportState.display.yearColumns.length === 0) {
    toast.warning('Seleziona almeno una colonna da mostrare nel PDF.')
    return
  }

  try {
    loading.value = true
    loadingMessage.value = 'Generazione PDF dinamico in corso...'
    await generateBetaDynamicPDF(processedData.value, reportState, activeFiltersSummary.value)
    toast.success('PDF Dinamico generato con successo!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

const getTabTitle = (tab) => {
  switch (tab) {
    case 'rinnovi':
      return 'Gestione Rinnovi & Tessere'
    case 'liste':
      return 'Elenchi Dati & Statistiche'
    case 'export':
      return 'Export & Backup'
    default:
      return 'Report'
  }
}

// Watchers
watch(renewalYear, (newVal) => {
  // Update preview data when year changes
  previewData.value.anno = newVal
})
</script>

<style scoped>
.reports-view {
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 2rem 0;
}

.reports-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  min-height: calc(100vh - 100px);
}

.reports-sidebar {
  padding-right: 1.5rem;
  border-right: 1px solid var(--color-border);
}

.reports-sidebar .sidebar-title {
  font-size: 1.1rem;
  color: var(--color-primary);
  margin-bottom: 2rem;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reports-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.nav-item:hover {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

.nav-item.active {
  background-color: var(--color-accent);
  color: white;
}

.reports-content {
  padding-bottom: 3rem;
}

/* Sections */
.report-section {
  background-color: var(--color-surface);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  padding: 1.5rem;
}

.header-section h2 {
  margin: 0;
  color: var(--color-primary);
}

/* Grid for Cards */
.reports-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.report-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.report-card h3 {
  margin-top: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.report-card p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  min-height: 40px;
}

/* Inputs & Buttons */
.year-selector-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.year-input {
  padding: 0.5rem;
  width: 100px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: bold;
}

.action-button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background-color: #a22a2a;
  transform: translateY(-1px);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.wide {
  width: auto;
  min-width: 200px;
}

.primary-button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.primary-button:hover {
  background-color: #a22a2a;
  transform: translateY(-1px);
}

.header-section {
  background: var(--color-surface);
  margin-bottom: 2rem;
  border-left: 5px solid var(--color-primary);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-row h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.year-selector-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--color-background);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

/* Preview Area */
.preview-wrapper {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.preview-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: center;
  border: 1px solid var(--color-border);
}

.preview-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.small-input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  width: 100%;
}

/* Filters */
.filters-inline {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filters-grid-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.f-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.f-group label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

/* Progress Bar Mini */
.progress-bar-mini {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  margin: 1rem 0;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s;
}

/* Batch Box */
.batch-box {
  background: var(--color-background);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.batch-box ul {
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
}

.batch-box li {
  display: inline-block;
  background: var(--color-surface);
  padding: 0.3rem 0.8rem;
  margin: 0.3rem;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
}

.primary-button.large {
  font-size: 1.1rem;
  padding: 1rem 3rem;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s infinite linear;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}
.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  background: var(--color-background);
  display: inline-block;
}
input:checked + .checkmark {
  background: var(--color-success);
  border-color: var(--color-success);
}

/* Radio Button styling */
.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}
.radiomark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  background: var(--color-background);
  display: inline-block;
  border-radius: 50%;
}
input[type="radio"] {
  display: none;
}
input[type="radio"]:checked + .radiomark {
  background: var(--color-success);
  border-color: var(--color-success);
  position: relative;
}
input[type="radio"]:checked + .radiomark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.8rem;
  letter-spacing: 0.3px;
  min-width: 24px;
}

.badge-success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.badge-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.badge-warning {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.badge-blue {
  background-color: #dbeafe;
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
}

/* Quick Cards Specific */
.quick-cards-grid {
  margin-bottom: 1rem;
}

.card-header-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.card-header-icon h3 {
  margin: 0;
}

.card-options-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: var(--color-background);
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.sort-selector-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.compact-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.filter-mini {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* PDF Lab Accordion */
.pdf-lab-accordion {
  border: 2px solid var(--color-accent);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.pdf-lab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 0;
  user-select: none;
}

.pdf-lab-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pdf-lab-title h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--color-accent);
}

.accordion-toggle-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}

.accordion-toggle-btn:hover {
  background: rgba(162, 42, 42, 0.08);
}

.pdf-lab-body {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pdf-lab-nav-btn {
  color: var(--color-accent) !important;
  font-weight: 600 !important;
}

/* Subcards */
.pdf-lab-subcard {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
}

.subcard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.subcard-header-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.subcard-header h4, .subcard-header-mini h6 {
  margin: 0;
  color: var(--color-text-primary);
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-with-icon h4, .title-with-icon h5 {
  margin: 0;
}

/* Filter Summary Card */
.filter-summary-card {
  background: rgba(0, 100, 200, 0.06);
  border-left: 4px solid var(--color-info, #0284c7);
  padding: 1rem 1.25rem;
  border-radius: 6px;
}

.summary-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  color: var(--color-info, #0284c7);
}

.summary-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--color-text-primary);
}

/* Buttons */
.btn-success-small {
  background-color: var(--color-success);
  color: white;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-secondary-small {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-group-links {
  display: flex;
  gap: 0.75rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0;
}

.link-btn.text-muted {
  color: var(--color-text-secondary);
  font-weight: normal;
}

/* Presets */
.presets-chip-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.preset-chip {
  display: inline-flex;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 0.3rem 0.75rem;
  font-size: 0.85rem;
  box-shadow: var(--shadow-sm);
}

.preset-name {
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-primary);
}

.preset-name:hover {
  color: var(--color-accent);
}

.preset-divider {
  width: 1px;
  height: 14px;
  background: var(--color-border);
  margin: 0 0.5rem;
}

.preset-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.6;
}

.preset-delete-btn:hover {
  opacity: 1;
}

.empty-hint {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* ACTIVE FILTERS BAR & CHIPS */
.active-filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.active-filters-bar.has-active {
  border-color: rgba(183, 28, 28, 0.35);
  background: linear-gradient(to right, var(--color-surface), rgba(183, 28, 28, 0.04));
}

.active-chips-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  flex: 1;
}

.active-title {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  margin-right: 0.25rem;
}

.active-count-badge {
  background: var(--color-accent);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
}

.active-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.filter-chip-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-accent);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--color-text-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.chip-text {
  font-weight: 500;
}

.chip-dismiss-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  opacity: 0.7;
  transition: opacity 0.15s;
}

.chip-dismiss-btn:hover {
  opacity: 1;
}

.reset-all-btn {
  min-height: 36px;
  font-size: 0.85rem;
}

/* 2-PILLAR STUDIO GRID */
.pdf-lab-studio-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1080px) {
  .pdf-lab-studio-grid {
    grid-template-columns: 1fr;
  }
}

.studio-pillar {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.pillar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border);
}

.pillar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pillar-title h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text-primary);
}

.pillar-badge {
  background: rgba(183, 28, 28, 0.12);
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

.pillar-badge-muted {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

/* CATEGORY TABS */
.category-tabs-bar {
  display: flex;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.category-tab-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.55rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 40px;
}

.category-tab-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.category-tab-btn.active {
  background: var(--color-surface);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.tab-count-badge {
  background: var(--color-accent);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.category-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

/* FILTER FIELDS & SEGMENTED CONTROLS */
.filter-toggle-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.toggle-hint {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-left: 1.75rem;
}

.filter-field-block, .layout-field-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-block-label {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--color-text-primary);
}

.segmented-control {
  display: flex;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
}

.segment-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 38px;
}

.segment-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.segment-btn.active {
  background: var(--color-surface);
  color: var(--color-text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid var(--color-border);
}

.segment-btn.status-ok-btn.active {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
  border-color: #2e7d32;
}

.segment-btn.status-warn-btn.active {
  background: rgba(194, 65, 12, 0.12);
  color: #c2410c;
  border-color: #c2410c;
}

.chip-label {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.88rem;
  transition: all 0.15s;
}

.chip-label:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}

.checkbox-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.35rem;
}

.logic-selector-box {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.columns-selection-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

/* COLUMN ORDER PILLS ROW */
.column-order-container {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.column-order-header-mini {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.column-order-pills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.column-order-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}

.col-pill-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.col-move-btn {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  padding: 0.2rem 0.35rem;
  display: flex;
  align-items: center;
  color: var(--color-text-primary);
}

.col-move-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sort-inline-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* ACTION BAR SOTTO I PILASTRI */
.pdf-lab-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.85rem 1.25rem;
  margin-top: 0.5rem;
}

.action-bar-stats {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}

.stat-badge strong {
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
}

.export-pdf-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  padding: 0.75rem 1.75rem;
  background-color: var(--color-accent);
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.export-pdf-btn:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: translateY(-1px);
}

/* Live Preview Table */
.live-preview-section {
  margin-top: 1rem;
}

.preview-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.legend-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.legend-title {
  font-weight: 600;
}

.senior-preview-wrapper {
  max-height: 520px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.senior-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.senior-table th {
  padding: 10px 12px;
  background: var(--color-surface);
  border-bottom: 2px solid var(--color-border);
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 5;
}

.senior-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
}

.badge-subtle {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.signature-line-blank {
  display: inline-block;
  width: 90px;
  border-bottom: 1px dotted var(--color-border);
  height: 12px;
}

.more-rows-notice {
  padding: 12px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  background: var(--color-background);
}

.empty-state-preview {
  padding: 2.5rem;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-background);
  border-radius: 8px;
  border: 1px dashed var(--color-border);
}

/* Responsive */
@media (max-width: 900px) {
  .reports-layout {
    grid-template-columns: 1fr;
  }

  .reports-sidebar {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1rem;
  }
  .reports-nav {
    flex-direction: row;
    overflow-x: auto;
  }
  .reports-grid,
  .filters-grid-compact {
    grid-template-columns: 1fr;
  }
  .preview-wrapper {
    flex-direction: column;
  }
  .preview-container {
    transform: scale(1);
    width: 100%;
  }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 0 2rem 0;
}
</style>
