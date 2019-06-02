/**
 * This is an improved version of alpha-algorithm for process model discovery.
 * While discovering special symbols are included in model notation
 *
 * They are based on existing project:
 * process-mining-js  Copyright (C) 2014  Kristina Spirovska
 * https://github.com/tspirovska/process-mining-js
 */

import {SYMBOL_LOOP_START, SYMBOL_TIME, SYMBOL_BAD} from "../constants/symbols"
import {findInArray, cloneObject, checkSubset} from "./SetsHandler"

/***
 * Get list of first transitions in traces
 * @param traces
 * @returns {Array}
 */
function createStart(traces) {
    let startTransitions = [];
    traces.forEach(trace => {
        if(! startTransitions.includes(trace[0])) {
            startTransitions.push(trace[0]);
        }
    });
    return startTransitions;
}

/***
 * Get list of last transitions in traces
 * @param traces
 * @returns {Array}
 */
function createFinish (traces) {
    let finishTransitions = [];
    traces.forEach(trace => {
        // if last transition has bad or time symbols
        // two symbol
        if((trace[trace.length - 3] === SYMBOL_BAD || trace[trace.length - 3] === SYMBOL_TIME) &&
            (trace[trace.length - 2] === SYMBOL_BAD || trace[trace.length - 2] === SYMBOL_TIME)) {
            let ev = trace[trace.length - 3] + trace[trace.length - 2] + trace[trace.length - 1];
            if(! finishTransitions.includes(ev)) {
                finishTransitions.push(ev);
            }
        } else
        // one symbol
        if(trace[trace.length - 2] === SYMBOL_BAD || trace[trace.length - 2] === SYMBOL_TIME) {
            let ev = trace[trace.length - 2] + trace[trace.length - 1];
            if(! finishTransitions.includes(ev)) {
                finishTransitions.push(ev);
            }
        } else {
            let ev = trace[trace.length - 1];
            if(! finishTransitions.includes(ev) && isNaN(Number.parseInt(ev, 10))) {
                finishTransitions.push(ev);
            }
            // if cycle is last
            else if (!isNaN(Number.parseInt(ev, 10))) {
                // if there are 2 symbols in cycle
                if (trace[trace.length-4] === SYMBOL_LOOP_START) {
                    let start = trace.length-4;
                    let finish = trace.length;
                    let loop = trace.slice(start, finish);
                    if(! finishTransitions.includes(loop)) {
                        finishTransitions.push(loop);
                    }
                }
                // значит 1 символ в цикле
                else if (trace[trace.length-3] === SYMBOL_LOOP_START) {
                    let start = trace.length-3;
                    let finish = trace.length;
                    let loop = trace.slice(start, finish);
                    if(! finishTransitions.includes(loop)) {
                        finishTransitions.push(loop);
                    }
                }
            }
        }

    });
    return finishTransitions;
}

/***
 * Get all unique transitions
 * @param traces
 * @returns {Array}
 */
function getTransitions (traces) {
    let transitions = [];
    traces.forEach(trace => {
        let i = 0;
        while (i < trace.length) {
            let current = trace[i];
            // если просто transition, то добавляем
            if(checkSymbols(current)) {
                if (! transitions.includes(current)) {
                    transitions.push(current);
                }
                i++;
            }
            // если с символом bad / time
            else if (current === SYMBOL_BAD || current === SYMBOL_TIME) {
                let next = trace[i+1];
                // если у нас два подряд
                if (next === SYMBOL_TIME || next === SYMBOL_BAD) {
                    current = current + next + trace [i+2];
                    i = i + 3;
                } else {
                    current = current + next;
                    i = i + 2;
                }
                if (! transitions.includes(current)) {
                    transitions.push(current);
                }
            }
            // если у нас цикл (current = SYMBOL_LOOP_START)
            else {
                // если цикл из 2
                if (! isNaN(Number.parseInt(trace[i+3], 10))) {
                    let start = i;
                    let finish = i + 4;
                    let loop = trace.slice(start, finish);
                    if(! transitions.includes(loop)) {
                        transitions.push(loop);
                    }
                    i = i + 4;
                }
                // если цикл из 1
                else {
                    let start = i;
                    let finish = i + 3;
                    let loop = trace.slice(start, finish);
                    if(! transitions.includes(loop)) {
                        transitions.push(loop);
                    }
                    i = i + 3;
                }
            }
        }
    });
    return transitions;
}

/***
 * Ensure that current symbol is an event
 * @param char
 * @returns {boolean}
 */
function checkSymbols (char) {
    let isNotNumber = isNaN(Number.parseInt(char, 10));
    return char !== SYMBOL_TIME && char !== SYMBOL_LOOP_START && isNotNumber && char !== SYMBOL_BAD
}

/**
 * Init empty footprint matrix
 * @param transitions: all unique transitions in logs
 * @returns {Array}
 * ['#''#''#']
 * ['#''#''#']
 * ['#''#''#']
 */
function initFootptintMatrix (transitions) {
    let fp = [];
    for (let i = 0; i < transitions.length; i++) {
        let row = [];
        for (let j = 0; j < transitions.length; j++) {
            row.push("#");
        }
        fp.push(row);
    }
    return fp;
}

/***
 * Fills footprint matrix
 * @param matrix - initialized fp matrix
 * @param transitions - all unique transitions in logs
 * @param traces - event log
 */
function createFPMatrix(matrix, transitions, traces) {
    traces.forEach(trace => {
        let i = 0;
        while (i < trace.length) {
            let current = trace[i];
            let next = trace[i+1];

            // если оба символа - события
            if (checkSymbols(current) && checkSymbols(next)) {
                i++;
            }
            // если next должен идти со спецсимволом
            else if (checkSymbols(current) && (next === SYMBOL_BAD || next === SYMBOL_TIME)) {
                // два спецсимвола f!*p
                if (trace[i+2] === SYMBOL_BAD || trace[i+2] === SYMBOL_TIME) {
                    next = next + trace[i+2] + trace[i+3];
                    i++;
                }
                // один спецсимвол
                else {
                    next = next + trace[i+2];
                    i++;
                }
            }
            // если current должен идти со спецсимволом !*fp
            else if (current === SYMBOL_BAD || current === SYMBOL_TIME) {
                // два спецсимвола
                if (next === SYMBOL_BAD || next === SYMBOL_TIME) {
                    current = current + next + trace[i+2];
                    next = trace[i+3];
                    i = i+3;
                }
                // один спецсимвол
                else {
                    current = current + next;
                    next = trace[i+2];
                    i = i + 2;
                }
            }
            // обработка циклов x@mn4c
            // next - начало цикла
            else if(checkSymbols(current) && next === SYMBOL_LOOP_START) {
                // цикл из двух
                if (! isNaN(Number.parseInt(trace[i+4], 10))) {
                    next = next + trace[i+2] + trace[i+3] + trace[i+4];
                    i++;
                }
                // цикл из одного
                else {
                    next = next + trace[i+1] + trace[i+3];
                    i++;
                }
            }
            // current - начало цикла @mn4cd
            else {
                //  цикл из двух
                if(!  isNaN(Number.parseInt(trace[i+3], 10))) {
                    current = current + next + trace[i+2] + trace[i+3];
                    next = trace[i+4];
                    i = i + 4;
                }
                // цикл из одного
                else {
                    current = current + next + trace [i+2];
                    next = trace [i + 3];
                    i = i + 3;
                }
            }

            let p1 = transitions.indexOf(current);
            let p2 = transitions.indexOf(next);

            if (matrix[p1][p2] === '#') {
                matrix[p1][p2] = '>';
                matrix[p2][p1] = '<';
            } else if (matrix[p1][p2] === '<') {
                matrix[p1][p2] = '|';
                matrix[p2][p1] = '|';
            }
        }
    });
}

function step4Part1(list, pair, ind) {
    let contains = false;
    for (let j = 0; j < list.length; j++) {
        let elem = list[j];
        if (elem[ind] === pair[ind]) {
            let index = (ind + 1) % 2;
            list[j][index].push(pair[index]);
            contains = true;
        }
    }

    if (!contains) {
        if (ind === 0) {
            list.push([ pair[0], [ pair[1] ] ]);
        } else {
            list.push([ [ pair[0] ], pair[1] ]);
        }
    }
}

function step4Part2(xSet, trans, matrix, pair, mode) {
    let val;
    let set;

    val = pair[(mode) % 2];
    set = pair[(mode + 1) % 2];

    let cond = true;
    for (let j = 0; j < set.length; j++) {
        let pos1 = trans.indexOf(val);
        let pos2 = trans.indexOf(set[j]);
        let mat;
        if (mode === 0) {
            mat = matrix[pos1][pos2];
        } else {
            mat = matrix[pos2][pos1];
        }
        if (mat !== ">") {
            cond = false;
        }
        if (cond === false) {
            break;
        }
    }

    for (let j = 0; (j < set.length) && cond; j++) {
        for (let k = 0; k < set.length && cond; k++) {
            let pos1 = trans.indexOf(set[j]);
            let pos2 = trans.indexOf(set[k]);
            if (matrix[pos1][pos2] !== "#") {
                cond = false;
            }
        }
    }

    if (cond) {
        let newPair = null;
        let inComplex = true;
        if (mode === 0) {
            if (pair[1].length === 1) {
                newPair = [ pair[0], pair[1][0] ];
                if (findInArray(xSet, newPair) === -1) {
                    xSet.push(newPair);
                }
                inComplex = false;
            }
        } else {
            newPair = [ pair[0][0], pair[1] ];
            if (pair[0].length === 1) {

                if (findInArray(xSet, newPair) === -1) {
                    xSet.push(newPair);
                }
                inComplex = false;
            }
        }

        if (inComplex) {
            if (findInArray(xSet, newPair)) {
                xSet.push(pair);
            }
        }
    }
}

function checkset (set, xSet, trans, matrix) {
    for (let i = 0; i < set.length; i++) {
        let pair = set[i];
        if (pair[1] instanceof Array) {
            step4Part2(xSet, trans, matrix, pair, 0);

        } else {
            step4Part2(xSet, trans, matrix, pair, 1);
        }
    }
}

/**
 * Creates pairs of set A and B.
 * Elements of such pairs should be separated by places
 * @param xSet - creates this object
 * @param trans - all unique transitions
 * @param matrix - footprint matrix
 */
function createXSet (xSet, trans, matrix){
    let list = [];

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {

            if (matrix[i][j] === '>') {
                list.push([ trans[i], trans[j] ]);
            }
        }
    }
    let xl = [];

    let list1 = [];
    let list2 = [];

    for (let i = 0; i < list.length; i++) {
        let pair = list[i];
        step4Part1(list1, pair, 0);
        step4Part1(list2, pair, 1);
    }
    xl = xl.concat(list1);
    xl = xl.concat(list2);
    checkset(xl, xSet, trans, matrix);
}

/**
 * Remove duplicates from xSet
 * @param xSet
 * @returns {*|*}
 */

function createYSet(xSet) {
    let ySet = cloneObject(xSet);
    let i = 0;
    let end = false;
    while (!end && i < ySet.length) {
        let pair = ySet[i];
        let j = i + 1;
        let erase = false;
        while (!erase && j < ySet.length) {
            if (checkSubset(pair, ySet[j])) {
                ySet.splice(i, 1);
                i--;
                erase = true;
            } else if (checkSubset(ySet[j], pair)) {
                ySet.splice(j, 1);
                j--;
            }
            j++;
        }
        i++;
    }
    return ySet
}

/**
 * Split ySet by adding places
 * @param ySet
 * @returns {Array}
 */
function createPSet(ySet) {
    let pSet = [];
    for (let i = 0; i < ySet.length; i++) {
        let elem = "P{" + ySet[i][0] + "},{" + ySet[i][1] + "}";
        pSet.push(elem);
    }
    pSet.push("I");
    pSet.push("O");
    return pSet
}

function createFSet(ti, to, ySet, pSet) {
    let fSet = [];
    for (let i = 0; i < ySet.length; i++) {
        if (ySet[i][0] instanceof Array) {
            for (let j = 0; j < ySet[i][0].length; j++) {
                fSet.push([ ySet[i][0][j], pSet[i] ]);
            }
        } else {
            fSet.push([ ySet[i][0], pSet[i] ]);
        }

        if (ySet[i][1] instanceof Array) {
            for (let j = 0; j < ySet[i][1].length; j++) {
                fSet.push([ pSet[i], ySet[i][1][j] ]);
            }
        } else {
            fSet.push([ pSet[i], ySet[i][1]]);
        }

    }

    for (let i = 0; i < ti.length; i++) {
        fSet.push([ "I", ti[i] ]);
    }

    for (let i = 0; i < to.length; i++) {
        fSet.push([ to[i], "O" ]);
    }

    return fSet;
}

/**
 * Main function that creates model for given traces
 * @param traces
 * @constructor
 */
export function CreateModel(traces) {
    let transitionList = getTransitions(traces);
    let ti = createStart(traces);
    let to = createFinish(traces);

    let fp = initFootptintMatrix(transitionList);
    createFPMatrix(fp, transitionList, traces);

    let xSet = [];
    createXSet(xSet, transitionList, fp);

    let ySet = createYSet(xSet);

    let pSet = createPSet(ySet);

    let fSet = createFSet(ti, to, ySet, pSet);

    return fSet
}
