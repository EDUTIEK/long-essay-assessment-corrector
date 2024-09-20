<script setup>
import { useApiStore } from '@/store/api';
import { useTaskStore } from '@/store/task';
import { useItemsStore } from '@/store/items';

const apiStore = useApiStore();
const taskStore = useTaskStore();
const itemsStore = useItemsStore();
</script>

<template>
  <v-main fill-height>

    <v-app-bar elevation="1" color="white" density="compact">
      <p>Lade Daten...</p>
      <v-spacer></v-spacer>
      <v-btn :href="apiStore.returnUrl">
        <v-icon left icon="mdi-logout-variant"></v-icon>
        <span>Meine Korrekturen</span>
      </v-btn>
    </v-app-bar>

    <v-dialog persistent v-model="apiStore.showInitFailure">
      <v-card>
        <v-card-text>
          <p>Beim Laden der Basisdaten ist ein Fehler aufgetreten. Die Anwendung kann nicht gestartet werden.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Beenden</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="apiStore.showItemLoadFailure">
      <v-card>
        <v-card-text>
          <p>Beim Laden der zu korrigierenden Abgabe ist ein Fehler aufgetreten. Die Anwendung kann nicht gestartet
            werden.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Beenden</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog persistent v-model="apiStore.showDataReplaceConfirmation">
      <v-card>
        <v-card-text>
          <p>In Ihrem Browser sind Daten eines anderen Korrektors oder einer anderen Aufgabe vorhanden, die noch nicht
            übertragen wurden:</p>
          <p><strong>{{ taskStore.title }}: {{
              itemsStore.getItem(apiStore.storedItemKey,
                  { key: 0, title: 'Unbekannt' }).title
            }}</strong></p>
          <p>Durch das Laden der neuen Korrektur werden diese Daten gelöscht. Möchten Sie die neuen Daten laden?</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.initAfterReplaceDataConfirmed">
            <v-icon left icon="mdi-reload"></v-icon>
            <span>Verwerfen und Laden</span>
          </v-btn>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Abbrechen</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="apiStore.showItemReplaceConfirmation">
      <v-card>
        <v-card-text>
          <p>In Ihrem Browser sind Daten Ihrer vorherigen Bearbeitung vorhanden, die noch nicht übertragen wurden:</p>
          <p><strong>{{ taskStore.title }}: {{
              itemsStore.getItem(apiStore.storedItemKey,
                  { key: 0, title: 'Unbekannt' }).title
            }}</strong></p>
          <p>Sie können mit diesen Daten weiter arbeiten, um sie nachträglich zu übertragen oder sie verwerfen.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.initAfterKeepDataConfirmed">
            <v-icon left icon="mdi-pencil-outline"></v-icon>
            <span>Mit lokalen Daten weiter arbeiten</span>
          </v-btn>
          <v-btn @click="apiStore.initAfterReplaceDataConfirmed">
            <v-icon left icon="mdi-trash-can-outline"></v-icon>
            <span>Lokale Daten verwerfen</span>
          </v-btn>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Abbrechen</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-main>
</template>


<style scoped>

</style>
