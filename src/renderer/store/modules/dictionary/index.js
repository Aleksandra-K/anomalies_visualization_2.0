/**
 *   Module that stores decoders and log clusters
 **/

const state = {
    transitions: {},
    symbols: {},
    clusters: []
}

const getters = {
    getDistinctClusters(state) {
        let distinct = [];
        state.clusters.forEach(trace => {
            if (! distinct.includes(trace.cluster_label)) {
                distinct.push(trace.cluster_label)
            }
        });
        return distinct;
    },

    getTracesByCluster: state => label => {
        let traces = [];
        state.clusters.forEach(trace=> {
            if(trace.cluster_label === label){
                traces.push(trace.UNIQ_ID)
            }
        });
        return traces;
    },

    getListOfTraces: state => label => {
        let traces = [];
        state.clusters.forEach(trace => {
            if(trace.cluster_label === label){
                traces.push(trace.trace)
            }
        });
        return traces;
    },

    decodeSymbol(state, symbol){
        return state.symbols[symbol];
    },

    decodeTransition(state, event) {
        return state.transitions[event];
    }
}

const actions = {
    addInfo ({state, commit}, payload) {
        console.log("hello from dict");
        switch (payload.type) {
            case 'cluster':
                commit('setEventLogs', payload.obj);
                break;
            case 'symbol':
                commit('setSymbolDecoder', payload.obj);
                break;
            case 'event':
                commit('setEventDecoder', payload.obj);
                break;
            default:
                alert("Загружен неизвестный файл");
        }
    }
}

const mutations = {
    setEventLogs (state, traces) {
        state.clusters = traces
    },

    setSymbolDecoder (state, decoder) {
        state.symbols = decoder
    },

    setEventDecoder (state, decoder) {
        state.transitions = decoder
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
