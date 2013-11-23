function addRow() {
    drawingarea = document.getElementById('drawingarea');
    row = drawingarea.insertRow();
    var length = drawingarea.rows[0].cells.length;
    for (var i = 0; i < length; i++) {
        cell = row.insertCell();
        cell.appendChild(document.createTextNode('b'));
    }
}

function addCol() {
    drawingarea = document.getElementById('drawingarea');
    var length = drawingarea.rows.length;
    for (var i = 0; i < length; i++) {
        row = drawingarea.rows[i];
        cell = row.insertCell();
        cell.appendChild(document.createTextNode('b'));
    }
}

function onWindowLoad() {
    for (var i = 0; i < 25; i++) {
        addRow();
    }
    for (var i = 0; i < 80; i++) {
        addCol();
    }
}

window.addEventListener('load', onWindowLoad, false);