var fs = require('fs');
let csvToJson = require('convert-csv-to-json');

export function loadJSON (path) {
    let rawdata = fs.readFileSync(path);
    return JSON.parse(rawdata)
}

export function loadCSV (path) {
    let logs = csvToJson.getJsonFromCsv(path);
    return logs
}
