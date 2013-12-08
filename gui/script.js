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

        var Point = (function () {
            function Point(row, col) {
                if (typeof row === "undefined") { row = 0; }
                if (typeof col === "undefined") { col = 0; }
                this.row = row;
                this.col = col;
            }
            Point.prototype.toString = function () {
                return this.row + 'x' + this.col;
            };

            Point.prototype.isEqual = function (other) {
                return (this.row == other.row && this.col == other.col);
            };
            return Point;
        })();
        utils.Point = Point;

        var Rectangle = (function () {
            function Rectangle(top_left, bottom_right) {
                this.top_left = top_left;
                this.bottom_right = bottom_right;
            }
            Rectangle.prototype.intersect = function (other) {
                var top_left = new Point(Math.max(this.top_left.row, other.top_left.row), Math.max(this.top_left.col, other.top_left.col));
                var bottom_right = new Point(Math.min(this.bottom_right.row, other.bottom_right.row), Math.min(this.bottom_right.col, other.bottom_right.col));
                return new Rectangle(top_left, bottom_right);
            };

            Rectangle.prototype.normalize = function () {
                if (this.top_left.row > this.bottom_right.row) {
                    var tmp = this.top_left.row;
                    this.top_left = new Point(this.bottom_right.row, this.top_left.col);
                    this.bottom_right = new Point(tmp, this.bottom_right.col);
                }
                if (this.top_left.col > this.bottom_right.col) {
                    var tmp = this.top_left.col;
                    this.top_left = new Point(this.top_left.row, this.bottom_right.col);
                    this.bottom_right = new Point(this.bottom_right.row, tmp);
                }
            };

            Rectangle.prototype.isNormalized = function () {
                return (this.top_left.row <= this.bottom_right.row) && (this.top_left.col <= this.bottom_right.col);
            };

            Rectangle.prototype.subtract = function (other) {
                var rect_array = [];
                var top_rectangle = new Rectangle(this.top_left, new Point(other.top_left.row - 1, this.bottom_right.col));
                if (top_rectangle.isNormalized()) {
                    rect_array.push(top_rectangle);
                }
                var left_rectangle = new Rectangle(new Point(other.top_left.row, this.top_left.col), new Point(other.bottom_right.row, other.top_left.col - 1));
                if (left_rectangle.isNormalized()) {
                    rect_array.push(left_rectangle);
                }
                var right_rectangle = new Rectangle(new Point(other.top_left.row, other.bottom_right.col + 1), new Point(other.bottom_right.row, this.bottom_right.col));
                if (right_rectangle.isNormalized()) {
                    rect_array.push(right_rectangle);
                }
                var bottom_rectangle = new Rectangle(new Point(other.bottom_right.row + 1, this.top_left.col), this.bottom_right);
                if (bottom_rectangle.isNormalized()) {
                    rect_array.push(bottom_rectangle);
                }
                return rect_array;
            };

            Rectangle.prototype.toString = function () {
                return this.top_left + "/" + this.bottom_right;
            };
            return Rectangle;
        })();
        utils.Rectangle = Rectangle;
    })(ascii_draw.utils || (ascii_draw.utils = {}));
    var utils = ascii_draw.utils;
})(ascii_draw || (ascii_draw = {}));
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = ascii_draw.utils.Rectangle;
    var CellPosition = ascii_draw.utils.Point;

    var SelectMoveController;
    (function (SelectMoveController) {
        var begin_selection = new CellPosition(0, 0);
        var end_selection = new CellPosition(0, 0);
        var selecting = false;
        var mouse_pos = null;

        function onMouseDown(target) {
            // TODO: if current cell is selected change to move mode
            selecting = true;
            clearSelection();

            // FIXME: share some code with onMouseOver
            begin_selection = getCellPosition(target);
            end_selection = begin_selection;
            setSelected(target, true);
        }
        SelectMoveController.onMouseDown = onMouseDown;

        function onMouseUp() {
            selecting = false;
        }
        SelectMoveController.onMouseUp = onMouseUp;

        function onMouseOver(target) {
            if (mouse_pos !== null) {
                ascii_draw.utils.removeClass(getCellAt(mouse_pos), 'mouse');
            }
            ascii_draw.utils.addClass(target, 'mouse');

            mouse_pos = getCellPosition(target);

            var new_end_selection = getCellPosition(target);

            var statusbar = document.getElementById('statusbar');
            statusbar.textContent = 'Position: ' + new_end_selection;
            statusbar.textContent += ' - Size: ' + ascii_draw.grid.rows.length + 'x' + ascii_draw.grid.rows[0].cells.length;

            if (!selecting) {
                return;
            }

            var selection = new Rectangle(begin_selection, end_selection);
            selection.normalize();

            var new_selection = new Rectangle(begin_selection, new_end_selection);
            new_selection.normalize();

            statusbar.textContent += ' - Selection: ' + (new_selection.bottom_right.row - new_selection.top_left.row + 1) + 'x' + (new_selection.bottom_right.col - new_selection.top_left.col + 1);

            if (new_end_selection.isEqual(end_selection)) {
                return;
            }

            var keep = selection.intersect(new_selection);
            var clear = selection.subtract(keep);
            var paint = new_selection.subtract(keep);

            for (var i = 0; i < clear.length; i++) {
                applyToRectangle(clear[i], setSelected, false);
            }

            for (var i = 0; i < paint.length; i++) {
                applyToRectangle(paint[i], setSelected, true);
            }

            end_selection = new_end_selection;
        }
        SelectMoveController.onMouseOver = onMouseOver;

        function onMouseLeave() {
            if (mouse_pos !== null) {
                ascii_draw.utils.removeClass(getCellAt(mouse_pos), 'mouse');
            }
            mouse_pos = null;
        }
        SelectMoveController.onMouseLeave = onMouseLeave;

        function clearSelection() {
            var selection = new Rectangle(begin_selection, end_selection);
            selection.normalize();
            applyToRectangle(selection, setSelected, false);
        }
    })(SelectMoveController || (SelectMoveController = {}));

    ascii_draw.grid;

    var emptyCell = ' ';

    function getCellPosition(cell) {
        return new CellPosition(ascii_draw.utils.indexInParent(cell.parentElement), ascii_draw.utils.indexInParent(cell));
    }

    function getCellAt(pos) {
        var row = ascii_draw.grid.rows[pos.row];
        var cell = row.cells[pos.col];
        return cell;
    }

    function applyToRectangle(rect, functor) {
        var params = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            params[_i] = arguments[_i + 2];
        }
        for (var r = rect.top_left.row; r <= rect.bottom_right.row; r++) {
            var row = ascii_draw.grid.rows[r];
            for (var c = rect.top_left.col; c <= rect.bottom_right.col; c++) {
                var cell = row.cells[c];
                functor.apply(undefined, [cell].concat(params));
            }
        }
    }

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
        if (cell['data-selected'] !== selected) {
            cell['data-selected'] == selected;
            if (selected) {
                ascii_draw.utils.addClass(cell, 'selected');
            } else {
                ascii_draw.utils.removeClass(cell, 'selected');
            }
        } else {
            console.log("bla");
        }
    }

    function getTargetCell(target) {
        if (target instanceof HTMLDivElement) {
            target = target.parentElement;
        }
        if (target instanceof HTMLTableCellElement) {
            return target;
        } else {
            return null;
        }
    }

    function onMouseDown(event) {
        var target = getTargetCell(event.target);
        if (target !== null) {
            SelectMoveController.onMouseDown(target);
        }
        event.preventDefault();
    }

    function onMouseUp(event) {
        SelectMoveController.onMouseUp();
        event.preventDefault();
    }

    function onMouseOver(event) {
        var target = getTargetCell(event.target);
        if (target !== null) {
            SelectMoveController.onMouseOver(target);
        }
        event.preventDefault();
    }

    function onMouseLeave(event) {
        SelectMoveController.onMouseLeave();
        event.preventDefault();
    }

    function init() {
        ascii_draw.grid = document.getElementById('grid');

        changeFont();
        resizeGrid(25, 80);
        setSelected(getCellAt(new CellPosition(0, 0)), true);

        ascii_draw.grid.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        ascii_draw.grid.addEventListener('mouseover', onMouseOver, false);
        ascii_draw.grid.addEventListener('mouseleave', onMouseLeave, false);
    }
    ascii_draw.init = init;
})(ascii_draw || (ascii_draw = {}));

window.addEventListener('load', ascii_draw.init, false);
