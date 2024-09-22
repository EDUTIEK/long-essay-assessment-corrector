<script setup>

import { useLayoutStore } from "../store/layout";

const layoutStore = useLayoutStore();

</script>

<template>
  <v-btn class="app-header-item" @click="layoutStore.showHelp=true">
    <v-icon left icon="mdi-help"></v-icon>
    Hilfe
  </v-btn>

  <v-dialog v-model="layoutStore.showHelp" max-width="1000">
    <v-card>
      <v-card-text>
        <h1>Allgemeine Navigation</h1>
        <v-table>
          <thead>
          <tr>
            <th width="50%">Aktion</th>
            <th width="50%">Tastenkombination</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Nächstes Element</td>
            <td>Tab</td>
          </tr>
          <tr>
            <td>Vorheriges Element</td>
            <td>Shift + Tab</td>
          </tr>
          <tr>
            <td>Header Schaltflächen</td>
            <td>Alt + 0</td>
          </tr>
          <tr>
            <td>Navigationsleiste Schaltflächen</td>
            <td>Alt + #</td>
          </tr>
          <tr>
            <td>Inhalt linke Spalte</td>
            <td>Alt + 1</td>
          </tr>
          <tr>
            <td>Inhalt rechte Spalte</td>
            <td>Alt + 2</td>
          </tr>
          </tbody>

        </v-table>

        <h1>Navigation im Editor</h1>

        <v-table>
          <thead>
          <tr>
            <th width="50%">Aktion</th>
            <th width="50%">Tastenkombination</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>In Symbolleiste wechseln</td>
            <td>Alt + F10</td>
          </tr>
          <tr>
            <td>Symbolleiste verlassen</td>
            <td>Esc</td>
          </tr>
          <tr>
            <td>In Symbolleiste zwischen Schaltflächen wechseln</td>
            <td>Pfeil links und rechts</td>
          </tr>
          <tr>
            <td>Popup der Absatzformate aufklappen</td>
            <td>Eingabetaste</td>
          </tr>
          <tr>
            <td>Im Popup zwischen Absatzformaten wechseln</td>
            <td>Pfeil abwärts und aufwärts</td>
          </tr>
          <tr>
            <td>Im Popup ein Absatzformat wählen</td>
            <td>Eingabetaste</td>
          </tr>
          <tr>
            <td>Popup der Absatzformate schließen</td>
            <td>Esc</td>
          </tr>

          </tbody>
        </v-table>

        <h1>Tastenbefehle im Editor</h1>
        <v-table title="Tastenbefehle im Editor">
          <thead>
          <tr>
            <th width="50%">Aktion</th>
            <th width="50%">Tastenkombination</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Fett</td>
            <td>Ctrl + B</td>
          </tr>
          <tr>
            <td>Kursiv</td>
            <td>Ctrl + I</td>
          </tr>
          <tr>
            <td>Unterstrichen</td>
            <td>Ctrl + U</td>
          </tr>
          <tr>
            <td>Alles auswählen</td>
            <td>Ctrl + A</td>
          </tr>
          <tr>
            <td>Wiederholen</td>
            <td>Ctrl + Y oder Ctrl + Shift + Z</td>
          </tr>
          <tr>
            <td>Rückgängig machen</td>
            <td>Ctrl + Z</td>
          </tr>
          <tr>
            <td>Überschrift 1</td>
            <td>Shift + Alt + 1</td>
          </tr>
          <tr>
            <td>Überschrift 2</td>
            <td>Shift + Alt + 2</td>
          </tr>
          <tr>
            <td>Überschrift 3</td>
            <td>Shift + Alt + 3</td>
          </tr>
          <tr>
            <td>Überschrift 4</td>
            <td>Shift + Alt + 4</td>
          </tr>
          <tr>
            <td>Überschrift 5</td>
            <td>Shift + Alt + 5</td>
          </tr>
          <tr>
            <td>Überschrift 6</td>
            <td>Shift + Alt + 6</td>
          </tr>
          <tr>
            <td>Absatz</td>
            <td>Shift + Alt + 7</td>
          </tr>
          </tbody>
        </v-table>

      </v-card-text>
      <v-card-actions>
        <v-btn @click="layoutStore.showHelp=false">
          <span>Hilfe schließen</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<style scoped>
h1 {
  font-size: 1.5rem;
}
</style>
