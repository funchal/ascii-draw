function addRow() {
    drawingarea = document.getElementById("drawingarea");
    var cells = drawingarea.rows[0].cells;
    r = drawingarea.insertRow();
    for (var i = 0; i < cells.length; i++) {
        c = r.insertCell();
        c.appendChild(document.createTextNode("b"));
    }
}

function addCol() {
    drawingarea = document.getElementById("drawingarea");
    var length = drawingarea.rows.length;
    for (var i = 0; i < length; i++) {
        c = drawingarea.rows[i].insertCell();
        c.appendChild(document.createTextNode("b"));
    }
}