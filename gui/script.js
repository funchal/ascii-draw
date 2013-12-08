var ascii_draw;
(function (ascii_draw) {
    (function (utils) {
        function changeStyleRule(selector, style, value) {
            var stylesheet = document.styleSheets[0];
            var rules = stylesheet.cssRules || stylesheet.rules;

            var match = null;
            for (var i = 0; i != rules.length; i++) {
                if (rules[i].type === CSSRule.STYLE_RULE) {
                    var style_rule = rules[i];
                    if (style_rule.selectorText == selector) {
                        match = style_rule.style;
                        break;
                    }
                }
            }

            if (match === null) {
                if (stylesheet.insertRule) {
                    stylesheet.insertRule(selector + ' {' + style + ':' + value + '}', rules.length);
                } else {
                    stylesheet.addRule(selector, style + ':' + value);
                }
            } else {
                match[style] = value;
            }
        }
        utils.changeStyleRule = changeStyleRule;

        function computeFontSize() {
            var tmp = document.createElement('table');
            var row = tmp.insertRow();
            var cell = row.insertCell();
            var div = document.createElement('div');
            div.textContent = 'X';
            cell.appendChild(div);
            document.body.appendChild(tmp);
            var w = cell.clientWidth;
            var h = cell.clientHeight;
            document.body.removeChild(tmp);
            return { width: w, height: h };
        }
        utils.computeFontSize = computeFontSize;

        function addClass(elem, new_class) {
            elem.className = elem.className + ' ' + new_class;
        }
        utils.addClass = addClass;

        function removeClass(elem, old_class) {
            var re = new RegExp('(?:^|\\s)' + old_class + '(?!\\S)', 'g');
            elem.className = elem.className.replace(re, '');
        }
        utils.removeClass = removeClass;

        /* find the index of a given element in its parent */
        function indexInParent(element) {
            var children = element.parentElement.children;
            for (var i = 0; i < children.length; i++) {
                if (children[i] == element) {
                    return i;
                }
            }
            return -1;
        }
        utils.indexInParent = indexInParent;

        function between(a, b, c) {
            return (a <= b && b <= c) || (c <= b && b <= a);
        }
        utils.between = between;
    })(ascii_draw.utils || (ascii_draw.utils = {}));
    var utils = ascii_draw.utils;
})(ascii_draw || (ascii_draw = {}));
var ascii_draw;
(function (ascii_draw) {
    var Coordinates = (function () {
        function Coordinates(row, col) {
            if (typeof row === "undefined") { row = 0; }
            if (typeof col === "undefined") { col = 0; }
            this.row = row;
            this.col = col;
        }
        return Coordinates;
    })();

    var SelectMoveController;
    (function (SelectMoveController) {
        var selecting = false;
        var S = new Coordinates(0, 0);
        var O = new Coordinates(0, 0);

        function onMouseDown(target) {
            // TODO: if current cell is selected change to move mode
            selecting = true;
            clearSelection();
            S.col = ascii_draw.utils.indexInParent(target);
            S.row = ascii_draw.utils.indexInParent(target.parentElement);
            O = S;
            setSelected(target, true);
        }
        SelectMoveController.onMouseDown = onMouseDown;

        function onMouseUp(target) {
            selecting = false;
        }
        SelectMoveController.onMouseUp = onMouseUp;

        function onMouseOver(target) {
            if (selecting) {
                var N = new Coordinates(ascii_draw.utils.indexInParent(target.parentElement), ascii_draw.utils.indexInParent(target));
                applyToRectangle(S, O, function (cell) {
                    setSelected(cell, false);
                });
                applyToRectangle(S, N, function (cell) {
                    setSelected(cell, true);
                });
                O = N;
            }
        }
        SelectMoveController.onMouseOver = onMouseOver;
    })(SelectMoveController || (SelectMoveController = {}));

    ascii_draw.grid;

    var emptyCell = ' ';

    function clearSelection() {
        var nrows = ascii_draw.grid.rows.length;
        for (var r = 0; r < nrows; r++) {
            var row = ascii_draw.grid.rows[r];
            var ncols = row.cells.length;
            for (var c = 0; c < ncols; c++) {
                var cell = row.cells[c];
                setSelected(cell, false);
            }
        }
    }

    function applyToRectangle(coordA, coordB, functor) {
        var min = new Coordinates();
        var max = new Coordinates();

        if (coordA.row < coordB.row) {
            min.row = coordA.row;
            max.row = coordB.row;
        } else {
            min.row = coordB.row;
            max.row = coordA.row;
        }

        if (coordA.col < coordB.col) {
            min.col = coordA.col;
            max.col = coordB.col;
        } else {
            min.col = coordB.col;
            max.col = coordA.col;
        }

        for (var r = min.row; r <= max.row; r++) {
            var row = ascii_draw.grid.rows[r];
            for (var c = min.col; c <= max.col; c++) {
                var cell = row.cells[c];
                functor(cell);
            }
        }
    }
    ;

    function resizeGrid(new_nrows, new_ncols) {
        var nrows = ascii_draw.grid.rows.length;

        for (var r = nrows; r < new_nrows; r++) {
            ascii_draw.grid.insertRow();
        }

        for (var r = nrows; r > new_nrows; r--) {
            ascii_draw.grid.deleteRow(r - 1);
        }

        for (var r = 0; r < new_nrows; r++) {
            var row = ascii_draw.grid.rows[r];
            var ncols = row.cells.length;
            for (var c = ncols; c < new_ncols; c++) {
                var cell = row.insertCell();
                var div = document.createElement('div');
                div.textContent = emptyCell;
                cell.appendChild(div);
            }

            for (var c = ncols; c > new_ncols; c--) {
                row.deleteCell(c - 1);
            }
        }
    }

    function changeFont() {
        ascii_draw.utils.changeStyleRule('td div', 'width', 'auto');
        ascii_draw.utils.changeStyleRule('td div', 'height', 'auto');

        var font_size = ascii_draw.utils.computeFontSize();

        ascii_draw.utils.changeStyleRule('td div', 'width', font_size.width + 'px');
        ascii_draw.utils.changeStyleRule('td div', 'height', font_size.height + 'px');
    }

    function setSelected(cell, selected) {
        if (cell['data-selected'] != selected) {
            cell['data-selected'] == selected;
            if (selected) {
                ascii_draw.utils.addClass(cell, 'selected');
            } else {
                ascii_draw.utils.removeClass(cell, 'selected');
            }
        }
    }

    function findCell(target) {
        if (target instanceof HTMLDivElement) {
            target = (target).parentElement;
        }
        if (target instanceof HTMLTableCellElement) {
            return target;
        } else {
            return null;
        }
    }

    function onMouseDown(event) {
        var target = findCell(event.target);
        if (target !== null) {
            SelectMoveController.onMouseDown(target);
        }
        event.preventDefault();
    }

    function onMouseUp(event) {
        var target = findCell(event.target);
        if (target !== null) {
            SelectMoveController.onMouseUp(target);
        }
        event.preventDefault();
    }

    function onMouseOver(event) {
        var target = findCell(event.target);
        if (target !== null) {
            SelectMoveController.onMouseOver(target);
        }
        event.preventDefault();
    }

    function init() {
        ascii_draw.grid = document.getElementById('grid');

        changeFont();
        resizeGrid(25, 80);

        var row = ascii_draw.grid.rows[0];
        var cell = row.cells[0];
        setSelected(cell, true);

        ascii_draw.grid.addEventListener('mousedown', onMouseDown, false);
        ascii_draw.grid.addEventListener('mouseup', onMouseUp, false);
        ascii_draw.grid.addEventListener('mouseover', onMouseOver, false);
    }
    ascii_draw.init = init;
})(ascii_draw || (ascii_draw = {}));

window.addEventListener('load', ascii_draw.init, false);
