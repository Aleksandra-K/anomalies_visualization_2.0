/**
 * This are util functions which are used while
 * performing an alpha-algorithm
 *
 * They are based on existing project:
 * process-mining-js  Copyright (C) 2014  Kristina Spirovska
 * https://github.com/tspirovska/process-mining-js
 */

export function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    var temp = obj.constructor();
    for ( var key in obj) {
        temp[key] = cloneObject(obj[key]);
    }

    return temp;
}

export function findInArray(array, elem) {
    let cond = false;
    let i = 0;
    let index = -1;
    while (!cond && i < array.length) {
        if (elem instanceof Array) {
            if (array[i] instanceof Array) {
                if (elem.length === array[i].length) {
                    let equal = true;
                    for (let j = 0; j < elem.length; j++) {
                        if (elem[j] !== array[i][j]) {
                            equal = false;
                        }
                    }
                    if (equal) {
                        cond = true;
                        index = i;
                    }
                }
            }
        } else {
            if (!(array[i] instanceof Array)) {
                if (array[i] === elem) {
                    cond = true;
                    index = i;
                }
            }
        }

        i++;

    }
    return index;
}

export function checkSubset(element, set) {
    return subset(element[0], set[0]) && subset(element[1], set[1]);
}

function subset(element, set) {
    if (element.length > set.length) {
        return false;
    }
    if (element instanceof Array) {
        if (set instanceof Array) {
            let same = true;
            let i = 0;

            while (same && i < element.length) {
                if (set.indexOf(element[i++]) === -1) {
                    same = false;
                    return false;
                }
            }
        } else {
            return false;
        }
    } else {
        if (set instanceof Array) {
            if (set.indexOf(element) === -1) {
                return false;
            }
        } else {
            if (element !== set) {
                return false;
            }
        }
    }

    return true;

}
