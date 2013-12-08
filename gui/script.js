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
        Coordinates.prototype.toString = function () {
            return this.row + 'x' + this.col;
        };

        Coordinates.prototype.isEqual = function (other) {
            return (this.row == other.row && this.col == other.col);
        };
        return Coordinates;
    })();

    var Rectangle = (function () {
        function Rectangle(top_left, bottom_right) {
            this.top_left = top_left;
            this.bottom_right = bottom_right;
        }
        Rectangle.prototype.intersect = function (other) {
            var top_left = new Coordinates(Math.max(this.top_left.row, other.top_left.row), Math.max(this.top_left.col, other.top_left.col));
            var bottom_right = new Coordinates(Math.min(this.bottom_right.row, other.bottom_right.row), Math.min(this.bottom_right.col, other.bottom_right.col));
            return new Rectangle(top_left, bottom_right);
        };

        Rectangle.prototype.normalize = function () {
            if (this.top_left.row > this.bottom_right.row) {
                var tmp = this.top_left.row;
                this.top_left = new Coordinates(this.bottom_right.row, this.top_left.col);
                this.bottom_right = new Coordinates(tmp, this.bottom_right.col);
            }
            if (this.top_left.col > this.bottom_right.col) {
                var tmp = this.top_left.col;
                this.top_left = new Coordinates(this.top_left.row, this.bottom_right.col);
                this.bottom_right = new Coordinates(this.bottom_right.row, tmp);
            }
        };

        Rectangle.prototype.isNormalized = function () {
            return (this.top_left.row <= this.bottom_right.row) && (this.top_left.col <= this.bottom_right.col);
        };

        Rectangle.prototype.subtract = function (other) {
            var rectangle_list = [];
            var top_rectangle = new Rectangle(this.top_left, new Coordinates(other.top_left.row - 1, this.bottom_right.col));
            if (top_rectangle.isNormalized()) {
                rectangle_list.push(top_rectangle);
            }
            var left_rectangle = new Rectangle(new Coordinates(other.top_left.row, this.top_left.col), new Coordinates(other.bottom_right.row, other.top_left.col - 1));
            if (left_rectangle.isNormalized()) {
                rectangle_list.push(left_rectangle);
            }
            var right_rectangle = new Rectangle(new Coordinates(other.top_left.row, other.bottom_right.col + 1), new Coordinates(other.bottom_right.row, this.bottom_right.col));
            if (right_rectangle.isNormalized()) {
                rectangle_list.push(right_rectangle);
            }
            var bottom_rectangle = new Rectangle(new Coordinates(other.bottom_right.row + 1, this.top_left.col), this.bottom_right);
            if (bottom_rectangle.isNormalized()) {
                rectangle_list.push(bottom_rectangle);
            }
            return rectangle_list;
        };

        Rectangle.prototype.toString = function () {
            return this.top_left + "/" + this.bottom_right;
        };

        Rectangle.prototype.applyForEach = function (functor) {
            for (var r = this.top_left.row; r <= this.bottom_right.row; r++) {
                var row = ascii_draw.grid.rows[r];
                for (var c = this.top_left.col; c <= this.bottom_right.col; c++) {
                    var cell = row.cells[c];
                    functor(cell);
                }
            }
        };
        return Rectangle;
    })();

    var SelectMoveController;
    (function (SelectMoveController) {
        var selecting = false;
        var begin_selection = new Coordinates(0, 0);
        var end_selection = new Coordinates(0, 0);

        function onMouseDown(target) {
            // TODO: if current cell is selected change to move mode
            selecting = true;
            clearSelection();
            begin_selection.row = ascii_draw.utils.indexInParent(target.parentElement);
            begin_selection.col = ascii_draw.utils.indexInParent(target);
            end_selection = begin_selection;
            setSelected(target, true);
        }
        SelectMoveController.onMouseDown = onMouseDown;

        function onMouseUp(target) {
            selecting = false;
        }
        SelectMoveController.onMouseUp = onMouseUp;

        function onMouseOver(target) {
            var new_end_selection = new Coordinates(ascii_draw.utils.indexInParent(target.parentElement), ascii_draw.utils.indexInParent(target));

            var statusbar = document.getElementById('statusbar');
            statusbar.textContent = 'Position: ' + new_end_selection;
            statusbar.textContent += ' - Size: ' + ascii_draw.grid.rows.length + 'x' + (ascii_draw.grid.rows[0]).cells.length;

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

            console.log('clear:' + clear);
            for (var i = 0; i < clear.length; i++) {
                clear[i].applyForEach(function (cell) {
                    setSelected(cell, false);
                });
            }

            console.log('paint:' + paint);
            for (var i = 0; i < paint.length; i++) {
                paint[i].applyForEach(function (cell) {
                    setSelected(cell, true);
                });
            }

            end_selection = new_end_selection;
        }
        SelectMoveController.onMouseOver = onMouseOver;

        function clearSelection() {
            var selection = new Rectangle(begin_selection, end_selection);
            selection.normalize();

            selection.applyForEach(function (cell) {
                setSelected(cell, false);
            });
        }
    })(SelectMoveController || (SelectMoveController = {}));

    ascii_draw.grid;

    var emptyCell = ' ';

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
