<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-app>
    <div id="app">
      <div id="toolbar">
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn
                    color="primary"
                    dark
                    v-on="on"
            >
              Файл
            </v-btn>
          </template>
          <v-list>
            <v-list-tile
                    v-for="(item, index) in menus"
                    :key="index"
                    @click="loadSelected(item)"
            >
              <v-list-tile-title>{{ item.title }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </div>
      <router-view></router-view>
    </div>
  </v-app>

</template>

<script>
  const {app, BrowserWindow} = require('electron');
  const { dialog } = require('electron').remote;

  import {loadCSV, loadJSON} from "./utils/FileHandler"
  import {
    UI_ACTIONS,
    STORE_DICT_ACTIONS
  } from "./constants/actions"

  export default {
    name: 'anomaly_visualizer',
    data: () =>({
      menus: [
        { title: UI_ACTIONS.FILE_LOGS },
        { title: UI_ACTIONS.EVENT_DECODER },
        { title: UI_ACTIONS.SYMBOL_DECODER }
      ]
    }),

    methods: {
      loadSelected(place) {
        var that = this.$store;
        dialog.showOpenDialog({ filters: [

            { name: 'decoders', extensions: ['json'] },
            { name: 'Данные', extensions: ['csv']}

          ]}, function (fileNames) {
          if (fileNames === undefined) return;
          const fileName = fileNames[0];

          if (place.title === UI_ACTIONS.FILE_LOGS ) {
            try {
              let log = loadCSV(fileName);
              let payload = {obj: log, type: STORE_DICT_ACTIONS.LOAD_LOGS}
              that.dispatch("dictionary/addInfo", payload)
            } catch (e) {
              alert("При загрузке файла с аномальными трассами возникла ошибка")
            }
          }
          else if (place.title === UI_ACTIONS.EVENT_DECODER) {
            try {
              let decoder = loadJSON(fileName);
              let payload = {obj: decoder, type: STORE_DICT_ACTIONS.LOAD_EVENTS}
              that.dispatch("dictionary/addInfo", payload)
            } catch (e) {
              alert("При загрузке декодера возникла ошибка")
            }
          }
          else {
            try {
              let decoder = loadJSON(fileName);
              let payload = {obj: decoder, type: STORE_DICT_ACTIONS.LOAD_SYMBOLS}
              that.dispatch("dictionary/addInfo", payload)
            } catch (e) {
              alert("При загрузке декодера возникла ошибка")
            }
          }
        });
      }
    }
  }
</script>

<style>
  /* CSS */
</style>
