import Vue from 'vue'
import Vuex from 'vuex'

import state from './state'
import getters from './getters'
import mutations from './mutations'
import actions from './actions'

import dictionary from './modules/dictionary'
import models from './modules/models'

Vue.use(Vuex);

export default new Vuex.Store({
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
  modules: {
    dictionary,
    models
  },
  strict: process.env.NODE_ENV !== 'production'
})
