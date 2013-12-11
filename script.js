var utils;
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
        function Rectangle(top_left, bottom_right, normalize) {
            this.top_left = top_left;
            this.bottom_right = bottom_right;
            if (normalize) {
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
            }
        }
        Rectangle.prototype.intersect = function (other) {
            var top_left = new Point(Math.max(this.top_left.row, other.top_left.row), Math.max(this.top_left.col, other.top_left.col));
            var bottom_right = new Point(Math.min(this.bottom_right.row, other.bottom_right.row), Math.min(this.bottom_right.col, other.bottom_right.col));
            return new Rectangle(top_left, bottom_right);
        };

        Rectangle.prototype.getHeight = function () {
            return this.bottom_right.row - this.top_left.row + 1;
        };

        Rectangle.prototype.getWidth = function () {
            return this.bottom_right.col - this.top_left.col + 1;
        };

        Rectangle.prototype.isEmpty = function () {
            return (this.top_left.row > this.bottom_right.row) || (this.top_left.col > this.bottom_right.col);
        };

        Rectangle.prototype.isEqual = function (other) {
            return (this.top_left.isEqual(other.top_left) && this.bottom_right.isEqual(other.bottom_right));
        };

        Rectangle.prototype.subtract = function (other) {
            var rect_array = [];
            if (this.isEmpty()) {
                return rect_array;
            }

            if (other.isEmpty()) {
                rect_array.push(this);
                return rect_array;
            }

            var top_rectangle = new Rectangle(this.top_left, new Point(other.top_left.row - 1, this.bottom_right.col));
            if (!top_rectangle.isEmpty()) {
                rect_array.push(top_rectangle);
            }
            var left_rectangle = new Rectangle(new Point(other.top_left.row, this.top_left.col), new Point(other.bottom_right.row, other.top_left.col - 1));
            if (!left_rectangle.isEmpty()) {
                rect_array.push(left_rectangle);
            }
            var right_rectangle = new Rectangle(new Point(other.top_left.row, other.bottom_right.col + 1), new Point(other.bottom_right.row, this.bottom_right.col));
            if (!right_rectangle.isEmpty()) {
                rect_array.push(right_rectangle);
            }
            var bottom_rectangle = new Rectangle(new Point(other.bottom_right.row + 1, this.top_left.col), this.bottom_right);
            if (!bottom_rectangle.isEmpty()) {
                rect_array.push(bottom_rectangle);
            }
            return rect_array;
        };

        Rectangle.prototype.toString = function () {
            return this.top_left + '/' + this.bottom_right;
        };
        return Rectangle;
    })();
    utils.Rectangle = Rectangle;
})(utils || (utils = {}));
///<reference path='utils.ts'/>
var ascii_draw;
(function (ascii_draw) {
    (function (controllers) {
        var Rectangle = utils.Rectangle;
        var CellPosition = utils.Point;

        (function (RectangleController) {
            function init() {
                console.log('init');
                var selection_button = document.getElementById('rectangle-button');
                utils.addClass(selection_button, 'pressed');
            }
            RectangleController.init = init;
            function onMouseDown(target) {
                console.log('down');
            }
            RectangleController.onMouseDown = onMouseDown;
            function onMouseUp() {
                console.log('up');
            }
            RectangleController.onMouseUp = onMouseUp;
            function onMouseOver(target) {
                console.log('over');
            }
            RectangleController.onMouseOver = onMouseOver;
            function onMouseLeave() {
                console.log('leave');
            }
            RectangleController.onMouseLeave = onMouseLeave;
            function exit() {
                console.log('exit');
                var selection_button = document.getElementById('rectangle-button');
                utils.removeClass(selection_button, 'pressed');
            }
            RectangleController.exit = exit;
        })(controllers.RectangleController || (controllers.RectangleController = {}));
        var RectangleController = controllers.RectangleController;

        (function (SelectMoveController) {
            var selecting = false;
            var mouse_pos = null;

            function init() {
                var selection_button = document.getElementById('selection-button');
                utils.addClass(selection_button, 'pressed');
                ascii_draw.begin_selection = new CellPosition(0, 0);
                ascii_draw.end_selection = ascii_draw.begin_selection;
                ascii_draw.setSelected(ascii_draw.getCellAt(ascii_draw.begin_selection), true);
            }
            SelectMoveController.init = init;

            function onMouseDown(target) {
                // TODO: if current cell is selected change to move mode
                selecting = true;
                setSelection(ascii_draw.getCellPosition(target), ascii_draw.getCellPosition(target));
            }
            SelectMoveController.onMouseDown = onMouseDown;

            function onMouseUp() {
                selecting = false;
            }
            SelectMoveController.onMouseUp = onMouseUp;

            function onMouseOver(target) {
                var pos = ascii_draw.getCellPosition(target);
                setMousePosition(pos);
                if (selecting) {
                    setSelection(ascii_draw.begin_selection, pos);
                }
            }
            SelectMoveController.onMouseOver = onMouseOver;

            function onMouseLeave() {
                setMousePosition(null);
            }
            SelectMoveController.onMouseLeave = onMouseLeave;

            function exit() {
                console.log('exit');
                var selection_button = document.getElementById('selection-button');
                utils.removeClass(selection_button, 'pressed');
            }
            SelectMoveController.exit = exit;

            function setMousePosition(new_pos) {
                if (mouse_pos !== null) {
                    utils.removeClass(ascii_draw.getCellAt(mouse_pos), 'mouse');
                }
                mouse_pos = new_pos;

                var mousestatus = document.getElementById('mousestatus');
                if (mouse_pos !== null) {
                    utils.addClass(ascii_draw.getCellAt(mouse_pos), 'mouse');
                    mousestatus.textContent = 'Cursor: ' + mouse_pos;
                } else {
                    mousestatus.textContent = '';
                }
            }

            function setSelection(new_begin_selection, new_end_selection) {
                var new_selection = new Rectangle(new_begin_selection, new_end_selection, true);
                var old_selection = new Rectangle(ascii_draw.begin_selection, ascii_draw.end_selection, true);

                if (old_selection.isEqual(new_selection)) {
                    return;
                }

                ascii_draw.begin_selection = new_begin_selection;
                ascii_draw.end_selection = new_end_selection;

                var keep = old_selection.intersect(new_selection);
                var clear = old_selection.subtract(keep);
                var paint = new_selection.subtract(keep);

                for (var i = 0; i < clear.length; i++) {
                    ascii_draw.applyToRectangle(clear[i], ascii_draw.setSelected, false);
                }

                for (var i = 0; i < paint.length; i++) {
                    ascii_draw.applyToRectangle(paint[i], ascii_draw.setSelected, true);
                }

                var selectionstatus = document.getElementById('selectionstatus');
                if (new_selection.getHeight() > 1 || new_selection.getWidth() > 1) {
                    selectionstatus.textContent = 'Selection: ' + new_selection.getHeight() + 'x' + new_selection.getWidth();
                } else {
                    selectionstatus.textContent = '';
                }
            }
            SelectMoveController.setSelection = setSelection;
        })(controllers.SelectMoveController || (controllers.SelectMoveController = {}));
        var SelectMoveController = controllers.SelectMoveController;
    })(ascii_draw.controllers || (ascii_draw.controllers = {}));
    var controllers = ascii_draw.controllers;
})(ascii_draw || (ascii_draw = {}));
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;

    var SelectMoveController = ascii_draw.controllers.SelectMoveController;
    var RectangleController = ascii_draw.controllers.RectangleController;

    ascii_draw.begin_selection;
    ascii_draw.end_selection;

    ascii_draw.grid;

    var emptyCell = ' ';

    var controller = SelectMoveController;

    function getSelectionContent() {
        return 'content\ncontent\ncontent\ncontent\ncontent\ncontent\n';
    }

    function initiateCopyAction() {
        if (window.getSelection && document.createRange) {
            var copypastearea = document.getElementById('copypastearea');
            copypastearea.textContent = getSelectionContent();
            var sel = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(copypastearea);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            console.log('fail to copy');
        }
    }

    function completeCopyAction() {
        var copypastearea = document.getElementById('copypastearea');
        copypastearea.value = '';
        console.log('copy');
    }

    function initiatePasteAction() {
        var copypastearea = document.getElementById('copypastearea');
        copypastearea.value = '';
        copypastearea.focus();
    }

    function completePasteAction() {
        var copypastearea = document.getElementById('copypastearea');
        console.log('paste: ' + copypastearea.value);
        copypastearea.value = '';
    }

    function onUndo() {
        console.log('undo');
    }

    function onRedo() {
        console.log('redo');
    }

    function onKeyUp(event) {
        if (event.ctrlKey && !event.altKey && !event.shiftKey) {
            switch (event.keyCode) {
                case 67:
                    completeCopyAction();
                    break;
                case 86:
                    completePasteAction();
                    break;
                case 88:
                    completeCopyAction();
                    break;
            }
        }
        event.stopPropagation();
    }

    function onKeyPress(event) {
        if (!event.ctrlKey && !event.altKey && !event.metaKey && event.charCode > 0) {
            applyToRectangle(new Rectangle(ascii_draw.begin_selection, ascii_draw.end_selection, true), function (cell) {
                cell.children[0].textContent = String.fromCharCode(event.charCode);
            });
            var displacement = [0, 1];
            if (displacement && ascii_draw.begin_selection.isEqual(ascii_draw.end_selection) && ascii_draw.begin_selection.isEqual(ascii_draw.end_selection)) {
                var pos = new CellPosition(ascii_draw.begin_selection.row + displacement[0], ascii_draw.begin_selection.col + displacement[1]);
                SelectMoveController.setSelection(pos, pos);
            }
            event.preventDefault();
        }
        event.stopPropagation();
    }

    function onKeyDown(event) {
        if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            var displacement = null;
            switch (event.keyCode) {
                case 37:
                    displacement = [0, -1];
                    event.preventDefault();
                    break;
                case 38:
                    displacement = [-1, 0];
                    event.preventDefault();
                    break;
                case 39:
                    displacement = [0, 1];
                    event.preventDefault();
                    break;
                case 40:
                    displacement = [1, 0];
                    event.preventDefault();
                    break;
                case 9:
                    event.preventDefault();
                    break;
                case 13:
                    event.preventDefault();
                    break;
                case 8:
                    event.preventDefault();
                    break;
                case 27:
                    event.preventDefault();
                    break;
                case 46:
                    event.preventDefault();
                    break;
            }

            if (displacement && ascii_draw.begin_selection.isEqual(ascii_draw.end_selection) && ascii_draw.begin_selection.isEqual(ascii_draw.end_selection)) {
                var pos = new CellPosition(ascii_draw.begin_selection.row + displacement[0], ascii_draw.begin_selection.col + displacement[1]);
                SelectMoveController.setSelection(pos, pos);
            }
        }

        if (event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            switch (event.keyCode) {
                case 67:
                    initiateCopyAction();
                    break;
                case 86:
                    initiatePasteAction();
                    break;
                case 88:
                    initiateCopyAction();
                    break;
                case 89:
                    onRedo();
                    break;
                case 90:
                    onUndo();
                    break;
            }
        }
        event.stopPropagation();
    }

    function getCellPosition(cell) {
        return new CellPosition(utils.indexInParent(cell.parentElement), utils.indexInParent(cell));
    }
    ascii_draw.getCellPosition = getCellPosition;

    function getCellAt(pos) {
        var row = ascii_draw.grid.rows[pos.row];
        var cell = row.cells[pos.col];
        return cell;
    }
    ascii_draw.getCellAt = getCellAt;

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
    ascii_draw.applyToRectangle = applyToRectangle;

    function setGridSize(new_nrows, new_ncols) {
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

        var gridstatus = document.getElementById('gridstatus');
        gridstatus.textContent = 'Grid size: ' + new_nrows + 'x' + new_ncols;
    }

    function changeFont() {
        utils.changeStyleRule('td div', 'width', 'auto');
        utils.changeStyleRule('td div', 'height', 'auto');

        var font_size = utils.computeFontSize();

        utils.changeStyleRule('td div', 'width', font_size.width + 'px');
        utils.changeStyleRule('td div', 'height', font_size.height + 'px');
    }

    function setSelected(cell, selected) {
        if (cell['data-selected'] !== selected) {
            cell['data-selected'] == selected;
            if (selected) {
                utils.addClass(cell, 'selected');
            } else {
                utils.removeClass(cell, 'selected');
            }
        } else {
            console.log('bla');
        }
    }
    ascii_draw.setSelected = setSelected;

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
            controller.onMouseDown(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event) {
        controller.onMouseUp();
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event) {
        var target = getTargetCell(event.target);
        if (target !== null) {
            controller.onMouseOver(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseLeave(event) {
        controller.onMouseLeave();
        event.stopPropagation();
        event.preventDefault();
    }

    function onContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    function controllerSwitcher(new_controller) {
        return function () {
            controller.exit();
            controller = new_controller;
            controller.init();
        };
    }

    function init() {
        ascii_draw.grid = document.getElementById('grid');

        changeFont();
        setGridSize(50, 120);

        controller.init();

        ascii_draw.grid.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        ascii_draw.grid.addEventListener('mouseover', onMouseOver, false);
        ascii_draw.grid.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);

        var rectangle_button = document.getElementById('rectangle-button');
        rectangle_button.addEventListener('click', controllerSwitcher(RectangleController), false);

        var selection_button = document.getElementById('selection-button');
        selection_button.addEventListener('click', controllerSwitcher(SelectMoveController), false);

        var undo_button = document.getElementById('undo-button');
        undo_button.addEventListener('click', onUndo, false);

        var redo_button = document.getElementById('redo-button');
        redo_button.addEventListener('click', onRedo, false);
    }
    ascii_draw.init = init;
})(ascii_draw || (ascii_draw = {}));

window.addEventListener('load', ascii_draw.init, false);
