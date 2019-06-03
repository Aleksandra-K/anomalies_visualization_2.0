<template>
    <div id="wrapper">
        <v-container fluid>
            <v-layout row justify-space-between>
                <v-flex
                        shrink
                        pa-1
                >
                    <div class="left-side">
                          <span class="title">
                            Паттерны аномалий
                          </span>
                          <span class="label">
                            Кластеры
                          </span>
                          <v-select
                            :items="clusterLabels"
                            v-on:change="getTraces"
                            class="selector"
                            outline
                          ></v-select>
                          <span class="label">
                            Case ID
                          </span>
                          <v-select
                            :items="traces"
                            class="selector"
                            outline
                          ></v-select>
                          <button
                                  class="button-emph"
                                  @click="renderModel">
                              Построить модель
                          </button><br><br>
                    </div>
                </v-flex>

                <v-flex
                        shrink
                        pa-1>
                    <v-spacer></v-spacer>
                </v-flex>

                <v-flex
                        grow
                        pa-1
                >
                    <v-card class="right-side">
                        <div class="paper">
                            <div class="title">Процесс ведение уголовного дела</div>
                            <div id="canvas"></div>
                        </div>
                    </v-card>
                </v-flex>
            </v-layout>

        </v-container>
    </div>
</template>

<script>
    import {mapGetters, mapMutations, mapActions} from 'vuex'
    import { CreateModel } from '../utils/AlphaMiner'
    import {SYMBOL_BAD, SYMBOL_TIME, SYMBOL_LOOP_START} from '../constants/symbols'
    import * as joint from "jointjs";

    export default {
        name: 'landing-page',
        data () {
            return {
                traces: [],
                currentCluster: []
            }
        },
        computed: {
            ...mapGetters({
                clusterLabels:'dictionary/getDistinctClusters',
                getTracesByCluster:'dictionary/getTracesByCluster',
                getArrayOfTraces: 'dictionary/getListOfTraces',
                decodeSymbol: 'dictionary/decodeSymbol',
                decodeTransition: 'dictionary/decodeTransition'
            })
        },
        methods: {
            open (link) {
                this.$electron.shell.openExternal(link)
            },
            getTraces(e) {
                this.currentCluster = e;
                this.traces = this.getTracesByCluster(e);
            },
            renderModel() {
                let graph = new joint.dia.Graph;
                let paper = new joint.dia.Paper({
                    el: document.getElementById('canvas'),
                    model: graph,
                    width: 800,
                    height: 1000,
                    gridSize: 1
                });

                let traceArray = this.getArrayOfTraces(this.currentCluster);
                let fSet = new CreateModel(traceArray);
                console.log(fSet);

                let visited = [];
                for (let i = 0; i < fSet.length; i++) {
                    visited[i] = false;
                }

                let current = "I";
                let currHeight = 10;
                let currWidth = 200;
                let graphPlaces = {};
                let graphTrans = {};
                let loopTrans = [];
                let graphLinks = [];
                this._make_graph(visited, graphPlaces, graphTrans, graphLinks, loopTrans, fSet, current, currHeight, currWidth);
                console.log('=================================');
                console.log('places:');
                console.log(graphPlaces)
                console.log('=================================');
                console.log('trans:');
                console.log(graphTrans);

                for (let key in graphPlaces){
                    graphPlaces[key].addTo(graph);
                }
                for (let key in graphTrans){
                    graphTrans[key].addTo(graph);
                }
                graphLinks.forEach(link => link.addTo(graph))
                console.log(paper)
            },
            _make_graph(visited, graphPlaces, graphTrans, graphLinks, loopTrans, fSet, current, height, width) {
                if(!visited.includes(false))
                    return;
                else {
                    let currArray = this._findTuple(fSet, current);
                    for (let i = 0; i < currArray.length; i++) {
                        if (i > 0) {
                            width = width + 110;
                        }
                        let tuple = currArray[i];
                        let index = fSet.indexOf(tuple);
                        let currP;
                        let currTr;
                        // если еще не были
                        if (! visited[index]) {
                            visited[index] = true;
                            // определяем, позиция это или переход
                            if (tuple[0].includes("P{") || tuple[0] === "I") {
                                currP = tuple[0];
                                currTr = tuple[1];
                            } else {
                                currP = tuple[1];
                                currTr = tuple[0];
                            }

                            debugger
                            // добавить  place, если нет
                            if (! (currP in graphPlaces) && !this._check_place(currP)) {
                                let el = new joint.shapes.pn.Place();
                                el.resize(30,30);
                                el.position(width + 40, height + 20);
                                height = height + 50;
                                graphPlaces[currP] = el;
                            }

                            let extraTrans;
                            let number;
                            // добавить transition, если нет
                            if(currTr.includes(SYMBOL_LOOP_START)) {
                                // debugger
                                extraTrans = currTr[2];
                                number = currTr[3];
                                currTr = currTr[1];
                            }
                            if(! (currTr in graphTrans)) {
                                let el = new joint.shapes.standard.Rectangle();
                                el.resize(100, 50);
                                el.position(width, height + 40);
                                let text = currTr.replace(SYMBOL_TIME, "");
                                text = text.replace(SYMBOL_BAD, "");
                                text = this.decodeSymbol(text);
                                text = this.decodeTransition(text);

                                if (currTr.includes(SYMBOL_BAD)) {
                                    el.attr({
                                        body: {
                                            fill: '#ff7070',
                                        },
                                        label: {
                                            text: text,
                                            fill: 'navy(16)',
                                            textWrap: 'true'
                                        }
                                    })
                                }
                                else {
                                    el.attr({
                                        body: {
                                            fill: '#89baff'
                                        },
                                        label: {
                                            text: text,
                                            fill: 'navy(16)',
                                            textWrap: 'true'
                                        }
                                    })
                                }
                                height = height + 90;
                                if (i > 0) {
                                    width = width - 110;
                                }
                                graphTrans[currTr] = el;

                            }

                            if(! this._check_place(currP)) {

                                let link;
                                // добавить link
                                if(currTr.includes(SYMBOL_TIME) && currTr === tuple[1]) {
                                    link = new joint.shapes.standard.Link();
                                    link.attr({
                                        line: {
                                            targetMarker: {
                                                type: 'image',
                                                'xlink:href': 'https://image.flaticon.com/icons/svg/148/148933.svg',
                                                'width': 25,
                                                'height': 25,
                                                'y': -12
                                            }
                                        }
                                    });
                                } else {
                                    link = new joint.shapes.standard.Link();
                                }
                                if (currP === tuple[0]) {
                                    link.source(graphPlaces[currP]);
                                    link.target(graphTrans[currTr]);
                                } else {
                                    link.target(graphPlaces[currP]);
                                    link.source(graphTrans[currTr]);
                                }

                                graphLinks.push(link);


                                if (loopTrans.length > 0) {
                                    if (typeof number === 'undefined')
                                        number = "";
                                    let link = new joint.shapes.standard.Link({
                                        labels: [{
                                            attrs: { text: { text: number }},
                                            position: {
                                                offset: 15,
                                                distance: 0.5
                                            }
                                        }]
                                    });
                                    let loop = loopTrans.pop();
                                    link.source(graphPlaces[currP]);
                                    link.target(graphTrans[loop]);
                                    link.attr('line/stroke', '#fe854f');
                                    graphLinks.push(link);
                                }

                                if(! (extraTrans in graphTrans) && typeof extraTrans !== 'undefined') {
                                    let el = new joint.shapes.standard.Rectangle();
                                    el.resize(100, 50);
                                    el.position(width + 150, height + 40);
                                    let text = extraTrans;
                                    text = this.decodeSymbol(text);
                                    text = this.decodeTransition(text);
                                    el.attr({
                                        body: {
                                            fill: '#89baff'
                                        },
                                        label: {
                                            text: text,
                                            fill: 'navy(16)',
                                            textWrap: 'true'
                                        }
                                    });
                                    graphTrans[extraTrans] = el;

                                    let link = new joint.shapes.standard.Link({
                                        labels: [{
                                            attrs: { text: { text: number }},
                                            position: {
                                                offset: 15,
                                                distance: 0.5
                                            }
                                        }]
                                    });
                                    link.target(graphPlaces[currP]);
                                    link.source(graphTrans[extraTrans]);
                                    link.attr('line/stroke', '#fe854f');
                                    graphLinks.push(link);

                                    loopTrans.push(extraTrans);

                                }
                            }

                        }
                        this._make_graph(visited, graphPlaces, graphTrans, graphLinks, loopTrans, fSet, tuple[1], height, width);
                    }
                }
            },
            _findTuple(array, elem) {
                let currents = [];
                for (let i = 0; i < array.length; i++) {
                    if(array[i][0] === elem)
                        currents.push(array[i]);
                }
                return currents;
            },
            _check_place(place) {
                if (place.length === 1) {
                    return false;
                }
                let plArr = place.split("},{");
                if (plArr[1].length < plArr[0].length) {
                    let str = plArr[1].replace("}", "");
                    return plArr[0].includes(str)
                } else {
                    let str = plArr[0].replace("P{", "");
                    return plArr[1].includes(str)
                }
            }
        }
    }
</script>

<style>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body { font-family: 'Source Sans Pro', sans-serif; }

    #wrapper {
        background:
                radial-gradient(
                        ellipse at top left,
                        rgba(178, 207, 255, 0.3) 40%,
                        rgba(255, 255, 255, .9) 100%
                );
        height: 100vh;
        padding: 10px 5px;
        width: 100vw;
    }

    main {
        display: flex;
        justify-content: space-between;
        flex-direction: row;
    }

    /*main > div { flex-basis: 50%; }*/

    .left-side {
        display: flex;
        flex-direction: column;
        padding-top: 1em;
    }

    .right-side {
        /*display: flex;*/
        /*flex-direction: column;*/
        padding: 1em 1em;
    }

    .title {
        color: #2c3e50;
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 6px;
    }

    .label {
        color: #485366;
        font-size: 18px;
        font-weight: initial;
        letter-spacing: .25px;
        margin-top: 10px;
    }

    .title.alt {
        font-size: 18px;
        margin-bottom: 10px;
    }

    .button-emph {
        font-size: .9em;
        cursor: pointer;
        outline: none;
        padding: 0.75em 2em;
        border-radius: 2em;
        display: inline-block;
        color: #fff;
        background-color: #639fff;
        transition: all 0.15s ease;
        box-sizing: border-box;
        border: 1px solid #5a95f4;
        width: fit-content;
    }

    .selector {
        width: 10em;
    }
</style>
