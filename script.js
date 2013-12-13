'use strict';
var utils;
(function (utils) {
    function changeStyleRule(selector, style, value) {
        var stylesheet = document.styleSheets[0];
        var rules = stylesheet.cssRules || stylesheet.rules;
        var match = null;

        if (rules !== null) {
            for (var i = 0; i != rules.length; i++) {
                if (rules[i].type === CSSRule.STYLE_RULE) {
                    var style_rule = rules[i];
                    if (style_rule.selectorText == selector) {
                        match = style_rule.style;
                        break;
                    }
                }
            }
        }

        if (match === null) {
            if (stylesheet.insertRule && rules !== null) {
                stylesheet.insertRule(selector + ' {' + style + ':' + value + '}', rules.length);
            } else {
                stylesheet.addRule(selector, style + ':' + value);
            }
        } else {
            match[style] = value;
        }
    }
    utils.changeStyleRule = changeStyleRule;

    function stacktrace() {
        console.log(new Error().stack);
    }
    utils.stacktrace = stacktrace;

    function computeFontSize() {
        var tmp = document.createElement('table');
        var row = tmp.insertRow();
        var cell = row.insertCell();
        cell.textContent = 'X';
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
            if (normalize && bottom_right.row < top_left.row) {
                this.top = bottom_right.row;
                this.bottom = top_left.row;
            } else {
                this.top = top_left.row;
                this.bottom = bottom_right.row;
            }
            if (normalize && bottom_right.col < top_left.col) {
                this.left = bottom_right.col;
                this.right = top_left.col;
            } else {
                this.left = top_left.col;
                this.right = bottom_right.col;
            }
        }
        Rectangle.prototype.intersect = function (other) {
            var top_left = new Point(Math.max(this.top, other.top), Math.max(this.left, other.left));
            var bottom_right = new Point(Math.min(this.bottom, other.bottom), Math.min(this.right, other.right));
            return new Rectangle(top_left, bottom_right);
        };

        Rectangle.prototype.getHeight = function () {
            // Warning: can be < 0 if this.isEmpty()
            return this.bottom - this.top + 1;
        };

        Rectangle.prototype.getWidth = function () {
            // Warning: can be < 0 if this.isEmpty()
            return this.right - this.left + 1;
        };

        Rectangle.prototype.isUnit = function () {
            return (this.top === this.bottom) && (this.left === this.right);
        };

        Rectangle.prototype.isEmpty = function () {
            return (this.top > this.bottom) || (this.left > this.right);
        };

        Rectangle.prototype.isEqual = function (other) {
            return (this.top == other.top && this.left == other.left && this.right == other.right && this.bottom == other.bottom);
        };

        /* Return the difference of this with other as a list of Rectangles.
        Examples:
        this (o), other (x), top (T), left (L), right (R), bottom (B)
        
        this      other     diff
        
        oooooo    ------    TTTTTT
        oooooo    ------    TTTTTT
        oooooo    --xx--    LL  RR
        oooooo    --xx--    LL  RR
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        
        
        oooooo    ------    TTTTTT
        oooooo    ------    TTTTTT
        oooooo    --xxxx    LL
        oooooo    --xxxx    LL
        oooooo    --xxxx    LL
        oooooo    --xxxx    LL
        xxxx
        xxxx
        
        
        oooooo    xx----      RRRR
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        oooooo    ------    BBBBBB
        
        */
        Rectangle.prototype.subtract = function (other) {
            var rect_array = [];
            if (this.isEmpty()) {
                return rect_array;
            }

            if (other.isEmpty()) {
                rect_array.push(this);
                return rect_array;
            }

            var top_rectangle = new Rectangle(new Point(this.top, this.left), new Point(other.top - 1, this.right));
            if (!top_rectangle.isEmpty()) {
                rect_array.push(top_rectangle);
            }

            var left_rectangle = new Rectangle(new Point(other.top, this.left), new Point(other.bottom, other.left - 1));
            if (!left_rectangle.isEmpty()) {
                rect_array.push(left_rectangle);
            }

            var right_rectangle = new Rectangle(new Point(other.top, other.right + 1), new Point(other.bottom, this.right));
            if (!right_rectangle.isEmpty()) {
                rect_array.push(right_rectangle);
            }

            var bottom_rectangle = new Rectangle(new Point(other.bottom + 1, this.left), new Point(this.bottom, this.right));
            if (!bottom_rectangle.isEmpty()) {
                rect_array.push(bottom_rectangle);
            }
            return rect_array;
        };

        Rectangle.prototype.move = function (rows, cols) {
            this.top += rows;
            this.left += cols;
            this.bottom += rows;
            this.right += cols;
        };

        Rectangle.prototype.toString = function () {
            return this.top + 'x' + this.left + '/' + this.bottom + 'x' + this.right;
        };
        return Rectangle;
    })();
    utils.Rectangle = Rectangle;
})(utils || (utils = {}));
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (grid) {
        var CellPosition = utils.Point;

        grid.container;
        var nrows = 0;
        var ncols = 0;

        ;
        ;

        function init() {
            grid.container = document.getElementById('grid');
            changeFont();
            setSize(50, 120);
        }
        grid.init = init;

        function getRow(row) {
            return grid.container.children[row];
        }
        grid.getRow = getRow;

        function getCell(row, col) {
            return row.children[col];
        }
        grid.getCell = getCell;

        function getCellPosition(cell) {
            return new CellPosition(utils.indexInParent(cell.parentElement), utils.indexInParent(cell));
        }
        grid.getCellPosition = getCellPosition;

        function getTargetCell(target) {
            if (target instanceof HTMLSpanElement) {
                return target;
            } else {
                return null;
            }
        }
        grid.getTargetCell = getTargetCell;

        function setSize(new_nrows, new_ncols) {
            for (var r = nrows; r < new_nrows; r++) {
                grid.container.appendChild(document.createElement('div'));
            }

            for (var r = nrows; r > new_nrows; r--) {
                grid.container.removeChild(grid.container.children[r]);
            }

            for (var r = 0; r < new_nrows; r++) {
                var row = getRow(r);
                for (var c = ncols; c < new_ncols; c++) {
                    var cell = row.appendChild(document.createElement('span'));
                    cell.textContent = ascii_draw.emptyCell;
                }

                for (var c = ncols; c > new_ncols; c--) {
                    row.removeChild(row.children[r]);
                }
            }

            nrows = new_nrows;
            ncols = new_ncols;

            ascii_draw.gridstatus.textContent = 'Grid size: ' + nrows + 'x' + ncols + ' (' + nrows * ncols + ')';
        }

        function changeFont() {
            utils.changeStyleRule('#grid span', 'width', 'auto');
            utils.changeStyleRule('#grid span', 'height', 'auto');
            utils.changeStyleRule('#grid div', 'height', 'auto');

            var font_size = utils.computeFontSize();

            utils.changeStyleRule('#grid span', 'width', font_size.width + 'px');
            utils.changeStyleRule('#grid span', 'height', font_size.height + 'px');
            utils.changeStyleRule('#grid div', 'height', font_size.height + 'px');
        }
    })(ascii_draw.grid || (ascii_draw.grid = {}));
    var grid = ascii_draw.grid;
})(ascii_draw || (ascii_draw = {}));
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (selection) {
        var Rectangle = utils.Rectangle;

        selection.contents = [];

        function clear() {
            for (var i = 0; i < selection.contents.length; i++) {
                ascii_draw.applyToRectangle(selection.contents[i], selectCell, false);
            }
            selection.contents = [];
        }
        selection.clear = clear;

        function set(new_contents) {
            var old_contents = selection.contents;
            for (var i = 0; i < selection.contents.length; i++) {
                ascii_draw.applyToRectangle(selection.contents[i], selectCell, false);
            }
            selection.contents = new_contents;
            for (var i = 0; i < selection.contents.length; i++) {
                ascii_draw.applyToRectangle(selection.contents[i], selectCell, true);
            }
            return old_contents;
        }
        selection.set = set;

        /* must not overlap any existing selection */
        function add(sel) {
            ascii_draw.applyToRectangle(sel, selectCell, true);
            selection.contents.push(sel);
        }
        selection.add = add;

        function remove(index) {
            ascii_draw.applyToRectangle(selection.contents[index], selectCell, false);
            selection.contents.splice(index, 1);
        }
        selection.remove = remove;

        function isUnit() {
            return (selection.contents.length == 1 && selection.contents[0].isUnit());
        }
        selection.isUnit = isUnit;

        function move(rows, cols) {
            for (var i = 0; i < selection.contents.length; i++) {
                ascii_draw.applyToRectangle(selection.contents[i], selectCell, false);
            }
            for (var i = 0; i < selection.contents.length; i++) {
                selection.contents[i].move(rows, cols);
            }
            for (var i = 0; i < selection.contents.length; i++) {
                ascii_draw.applyToRectangle(selection.contents[i], selectCell, true);
            }
        }
        selection.move = move;

        function getContents() {
            return 'content\ncontent\ncontent\ncontent\ncontent\ncontent\n';
        }
        selection.getContents = getContents;

        function selectCell(cell, selected) {
            if (cell['data-selected'] !== selected) {
                cell['data-selected'] = selected;
                if (selected) {
                    utils.addClass(cell, 'selected');
                } else {
                    utils.removeClass(cell, 'selected');
                }
            } else {
                console.log('selected');
            }
        }
    })(ascii_draw.selection || (ascii_draw.selection = {}));
    var selection = ascii_draw.selection;
})(ascii_draw || (ascii_draw = {}));
///<reference path='utils.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (commands) {
        var Rectangle = utils.Rectangle;

        var history = [];
        var limit = 100;
        var current = 0;

        var redo_button;
        var undo_button;

        var ReplaceSelection = (function () {
            function ReplaceSelection(save_selection) {
                this.save_selection = save_selection;
            }
            ReplaceSelection.prototype.execute = function () {
                console.log('execute ReplaceSelection');
                this.save_selection = ascii_draw.selection.set(this.save_selection);
            };

            ReplaceSelection.prototype.unexecute = function () {
                console.log('unexecute ReplaceSelection');
                this.save_selection = ascii_draw.selection.set(this.save_selection);
            };
            return ReplaceSelection;
        })();
        commands.ReplaceSelection = ReplaceSelection;

        var FillSelection = (function () {
            function FillSelection(character) {
                this.character = character;
            }
            FillSelection.prototype.execute = function () {
                console.log('execute FillSelection');

                for (var i = 0; i < ascii_draw.selection.contents.length; i++) {
                    ascii_draw.applyToRectangle(ascii_draw.selection.contents[i], ascii_draw.controllers.writeToCell, this.character);
                }

                if (ascii_draw.selection.isUnit()) {
                    ascii_draw.selection.move(0, 1);
                }
            };

            FillSelection.prototype.unexecute = function () {
                console.log('unexecute FillSelection');
                if (ascii_draw.selection.isUnit()) {
                    ascii_draw.selection.move(0, -1);
                }

                for (var i = 0; i < ascii_draw.selection.contents.length; i++) {
                    ascii_draw.applyToRectangle(ascii_draw.selection.contents[i], ascii_draw.controllers.writeToCell, ' ');
                }
            };
            return FillSelection;
        })();
        commands.FillSelection = FillSelection;

        function init() {
            undo_button = document.getElementById('undo-button');
            redo_button = document.getElementById('redo-button');
            update();
            undo_button.addEventListener('click', onUndo, false);
            redo_button.addEventListener('click', onRedo, false);
        }
        commands.init = init;

        function invoke(cmd) {
            history.splice(current, history.length - current, cmd);
            if (history.length > limit) {
                history.shift();
                current--;
            }
            redo();
        }
        commands.invoke = invoke;

        function onUndo() {
            if (canUndo()) {
                undo();
            }
        }
        commands.onUndo = onUndo;

        function onRedo() {
            if (canRedo()) {
                redo();
            }
        }
        commands.onRedo = onRedo;

        function undo() {
            current--;
            history[current].unexecute();
            update();
        }

        function redo() {
            current++;
            history[current - 1].execute();
            update();
        }

        function canUndo() {
            return (current > 0);
        }

        function canRedo() {
            return (current < history.length);
        }

        function update() {
            if (canUndo()) {
                undo_button.disabled = false;
            } else {
                undo_button.disabled = true;
            }

            if (canRedo()) {
                redo_button.disabled = false;
            } else {
                redo_button.disabled = true;
            }
        }
    })(ascii_draw.commands || (ascii_draw.commands = {}));
    var commands = ascii_draw.commands;
})(ascii_draw || (ascii_draw = {}));
///<reference path='utils.ts'/>
///<reference path='grid.ts'/>
///<reference path='selection.ts'/>
///<reference path='commands.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (controllers) {
        var Rectangle = utils.Rectangle;
        var CellPosition = utils.Point;

        (function (RectangleController) {
            function activate() {
                console.log('activate RectangleController');
                utils.addClass(ascii_draw.rectangle_button, 'pressed');
            }
            RectangleController.activate = activate;

            function deactivate() {
                console.log('deactivate RectangleController');
                utils.removeClass(ascii_draw.rectangle_button, 'pressed');
            }
            RectangleController.deactivate = deactivate;

            function onMouseDown(target) {
                // TODO: if current cell is highlighted change to move mode
                highlighting = true;
                setHollowHighlight(ascii_draw.grid.getCellPosition(target), ascii_draw.grid.getCellPosition(target));
                drawRectangle(new Rectangle(controllers.begin_highlight, controllers.end_highlight, true));
            }
            RectangleController.onMouseDown = onMouseDown;

            function onMouseUp() {
                if (highlighting) {
                    var new_selection = setHollowHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
                    highlighting = false;

                    ascii_draw.commands.invoke(new ascii_draw.commands.ReplaceSelection(new_selection));
                }
            }
            RectangleController.onMouseUp = onMouseUp;

            function onMouseOver(target) {
                var pos = ascii_draw.grid.getCellPosition(target);
                setMousePosition(pos);
                if (highlighting) {
                    setHollowHighlight(controllers.begin_highlight, pos);
                    drawRectangle(new Rectangle(controllers.begin_highlight, controllers.end_highlight, true));
                }
            }
            RectangleController.onMouseOver = onMouseOver;

            function onMouseLeave() {
                setMousePosition(null);
            }
            RectangleController.onMouseLeave = onMouseLeave;

            function onArrowDown(displacement) {
                if (highlighting) {
                    return;
                }

                /* this should really be implemented by a MoveController */
                ascii_draw.selection.move(displacement[0], displacement[1]);
            }
            RectangleController.onArrowDown = onArrowDown;

            function onKeyPress(character) {
                if (highlighting) {
                    return;
                }

                ascii_draw.commands.invoke(new ascii_draw.commands.FillSelection(character));
            }
            RectangleController.onKeyPress = onKeyPress;

            function drawRectangle(rect) {
                var top = rect.top;
                var left = rect.left;
                var bottom = rect.bottom;
                var right = rect.right;

                // print first row: +---+
                var first_row = ascii_draw.grid.getRow(top);
                controllers.writeToCell(ascii_draw.grid.getCell(first_row, left), '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    controllers.writeToCell(ascii_draw.grid.getCell(first_row, col), '-');
                }
                controllers.writeToCell(ascii_draw.grid.getCell(first_row, right), '+');

                for (var row = top + 1; row <= bottom - 1; row++) {
                    var current_row = ascii_draw.grid.getRow(row);
                    controllers.writeToCell(ascii_draw.grid.getCell(current_row, left), '|');
                    controllers.writeToCell(ascii_draw.grid.getCell(current_row, right), '|');
                }

                // print last row
                var last_row = ascii_draw.grid.getRow(bottom);
                controllers.writeToCell(ascii_draw.grid.getCell(last_row, left), '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    controllers.writeToCell(ascii_draw.grid.getCell(last_row, col), '-');
                }
                controllers.writeToCell(ascii_draw.grid.getCell(last_row, right), '+');
            }
        })(controllers.RectangleController || (controllers.RectangleController = {}));
        var RectangleController = controllers.RectangleController;

        (function (SelectMoveController) {
            function activate() {
                console.log('activate SelectMoveController');
                utils.addClass(ascii_draw.selection_button, 'pressed');
            }
            SelectMoveController.activate = activate;

            function deactivate() {
                console.log('deactivate SelectMoveController');
                utils.removeClass(ascii_draw.selection_button, 'pressed');
            }
            SelectMoveController.deactivate = deactivate;

            function onMouseDown(target) {
                // TODO: if current cell is highlighted change to move mode
                highlighting = true;
                controllers.setHighlight(ascii_draw.grid.getCellPosition(target), ascii_draw.grid.getCellPosition(target));
            }
            SelectMoveController.onMouseDown = onMouseDown;

            function onMouseUp() {
                if (highlighting) {
                    var new_selection = new Rectangle(controllers.begin_highlight, controllers.end_highlight, true);
                    controllers.setHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
                    highlighting = false;

                    ascii_draw.commands.invoke(new ascii_draw.commands.ReplaceSelection([new_selection]));
                }
            }
            SelectMoveController.onMouseUp = onMouseUp;

            function onMouseOver(target) {
                var pos = ascii_draw.grid.getCellPosition(target);
                setMousePosition(pos);
                if (highlighting) {
                    controllers.setHighlight(controllers.begin_highlight, pos);
                }
            }
            SelectMoveController.onMouseOver = onMouseOver;

            function onMouseLeave() {
                setMousePosition(null);
            }
            SelectMoveController.onMouseLeave = onMouseLeave;

            function onArrowDown(displacement) {
                if (highlighting) {
                    return;
                }

                /* this should really be implemented by a MoveController */
                ascii_draw.selection.move(displacement[0], displacement[1]);
            }
            SelectMoveController.onArrowDown = onArrowDown;

            function onKeyPress(character) {
                if (highlighting) {
                    return;
                }

                ascii_draw.commands.invoke(new ascii_draw.commands.FillSelection(character));
            }
            SelectMoveController.onKeyPress = onKeyPress;
        })(controllers.SelectMoveController || (controllers.SelectMoveController = {}));
        var SelectMoveController = controllers.SelectMoveController;

        controllers.begin_highlight = new CellPosition(0, 0);
        controllers.end_highlight = controllers.begin_highlight;

        var highlighting = false;
        var mouse_pos = null;

        controllers.current = SelectMoveController;

        function swap(new_controller) {
            return function () {
                controllers.current.deactivate();
                controllers.current = new_controller;
                controllers.current.activate();
            };
        }
        controllers.swap = swap;

        function init() {
            controllers.current.activate();
            ascii_draw.selection.clear();
            ascii_draw.selection.add(new Rectangle(controllers.begin_highlight, controllers.end_highlight, true));
        }
        controllers.init = init;

        function setMousePosition(new_pos) {
            if (mouse_pos !== null) {
                var cell = ascii_draw.grid.getCell(ascii_draw.grid.getRow(mouse_pos.row), mouse_pos.col);
                utils.removeClass(cell, 'mouse');
            }
            mouse_pos = new_pos;

            var mousestatus = document.getElementById('mousestatus');
            if (mouse_pos !== null) {
                var cell = ascii_draw.grid.getCell(ascii_draw.grid.getRow(mouse_pos.row), mouse_pos.col);
                utils.addClass(cell, 'mouse');
                mousestatus.textContent = 'Cursor: ' + mouse_pos;
            } else {
                mousestatus.textContent = '';
            }
        }

        function setHighlight(new_begin_highlight, new_end_highlight) {
            var new_highlight = new Rectangle(new_begin_highlight, new_end_highlight, true);
            var old_highlight = new Rectangle(controllers.begin_highlight, controllers.end_highlight, true);

            if (old_highlight.isEqual(new_highlight)) {
                return;
            }

            controllers.begin_highlight = new_begin_highlight;
            controllers.end_highlight = new_end_highlight;

            var keep = old_highlight.intersect(new_highlight);
            var clear = old_highlight.subtract(keep);
            var paint = new_highlight.subtract(keep);

            for (var i = 0; i < paint.length; i++) {
                ascii_draw.applyToRectangle(paint[i], setHighlighted, true);
            }

            for (var i = 0; i < clear.length; i++) {
                ascii_draw.applyToRectangle(clear[i], setHighlighted, false);
            }

            if (new_highlight.getHeight() > 1 || new_highlight.getWidth() > 1) {
                ascii_draw.selectionstatus.textContent = 'Highlight: ' + new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            } else {
                ascii_draw.selectionstatus.textContent = '';
            }
        }
        controllers.setHighlight = setHighlight;

        function getHollowRectangle(rect) {
            var inside_rect = new Rectangle(new CellPosition(rect.top + 1, rect.left + 1), new CellPosition(rect.bottom - 1, rect.right - 1));
            var surrounding = rect.subtract(inside_rect);
            return surrounding;
        }

        function setHollowHighlight(new_begin_highlight, new_end_highlight) {
            var new_highlight = new Rectangle(new_begin_highlight, new_end_highlight, true);
            var old_highlight = new Rectangle(controllers.begin_highlight, controllers.end_highlight, true);

            if (old_highlight.isEqual(new_highlight)) {
                return;
            }

            controllers.begin_highlight = new_begin_highlight;
            controllers.end_highlight = new_end_highlight;

            var old_pieces = getHollowRectangle(old_highlight);
            for (var piece = 0; piece < old_pieces.length; piece++) {
                ascii_draw.applyToRectangle(old_pieces[piece], setHighlighted, false);
            }

            var new_pieces = getHollowRectangle(new_highlight);
            for (var piece = 0; piece < new_pieces.length; piece++) {
                ascii_draw.applyToRectangle(new_pieces[piece], setHighlighted, true);
            }

            var selectionstatus = document.getElementById('selectionstatus');
            if (new_highlight.getHeight() > 1 || new_highlight.getWidth() > 1) {
                selectionstatus.textContent = 'Highlight: ' + new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            } else {
                selectionstatus.textContent = '';
            }

            return old_pieces;
        }

        function writeToCell(cell, character) {
            cell.textContent = character;
        }
        controllers.writeToCell = writeToCell;

        function setHighlighted(cell, highlighted) {
            if (cell['data-highlighted'] !== highlighted) {
                cell['data-highlighted'] = highlighted;
                if (highlighted) {
                    utils.addClass(cell, 'highlighted');
                } else {
                    utils.removeClass(cell, 'highlighted');
                }
            } else {
                console.log('highlighted');
            }
        }
    })(ascii_draw.controllers || (ascii_draw.controllers = {}));
    var controllers = ascii_draw.controllers;
})(ascii_draw || (ascii_draw = {}));
///<reference path='controllers.ts'/>
///<reference path='utils.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;
    var SelectMoveController = ascii_draw.controllers.SelectMoveController;
    var RectangleController = ascii_draw.controllers.RectangleController;

    var copypastearea;

    ascii_draw.selection_button;
    ascii_draw.rectangle_button;

    ascii_draw.gridstatus;
    ascii_draw.mousestatus;
    ascii_draw.selectionstatus;

    ascii_draw.emptyCell = ' ';

    function initiateCopyAction() {
        if (window.getSelection && document.createRange) {
            copypastearea.textContent = ascii_draw.selection.getContents();
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
        copypastearea.value = '';
        console.log('copy');
    }

    function initiatePasteAction() {
        copypastearea.value = '';
        copypastearea.focus();
    }

    function completePasteAction() {
        console.log('paste: ' + copypastearea.value);
        copypastearea.value = '';
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
            ascii_draw.controllers.current.onKeyPress(String.fromCharCode(event.charCode));
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
                    // TODO: print a space character
                    event.preventDefault();
                    break;
                case 27:
                    event.preventDefault();
                    break;
                case 46:
                    event.preventDefault();
                    break;
            }

            if (displacement !== null) {
                ascii_draw.controllers.current.onArrowDown(displacement);
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
                    ascii_draw.commands.onRedo();
                    break;
                case 90:
                    ascii_draw.commands.onUndo();
                    break;
            }
        }
        event.stopPropagation();
    }

    function applyToRectangle(rect, functor, param) {
        for (var r = rect.top; r <= rect.bottom; r++) {
            var row = ascii_draw.grid.getRow(r);
            for (var c = rect.left; c <= rect.right; c++) {
                var cell = ascii_draw.grid.getCell(row, c);
                functor(cell, param);
            }
        }
    }
    ascii_draw.applyToRectangle = applyToRectangle;

    function onMouseDown(event) {
        var target = ascii_draw.grid.getTargetCell(event.target);
        if (target !== null) {
            ascii_draw.controllers.current.onMouseDown(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event) {
        ascii_draw.controllers.current.onMouseUp();
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event) {
        var target = ascii_draw.grid.getTargetCell(event.target);
        if (target !== null) {
            ascii_draw.controllers.current.onMouseOver(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseLeave(event) {
        ascii_draw.controllers.current.onMouseLeave();
        event.stopPropagation();
        event.preventDefault();
    }

    function onContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    function init() {
        copypastearea = document.getElementById('copypastearea');
        ascii_draw.rectangle_button = document.getElementById('rectangle-button');
        ascii_draw.selection_button = document.getElementById('selection-button');
        ascii_draw.gridstatus = document.getElementById('gridstatus');
        ascii_draw.selectionstatus = document.getElementById('selectionstatus');
        ascii_draw.mousestatus = document.getElementById('mousestatus');

        ascii_draw.grid.init();
        ascii_draw.controllers.init();
        ascii_draw.commands.init();

        ascii_draw.grid.container.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        ascii_draw.grid.container.addEventListener('mouseover', onMouseOver, false);
        ascii_draw.grid.container.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);

        ascii_draw.rectangle_button.addEventListener('click', ascii_draw.controllers.swap(RectangleController), false);

        ascii_draw.selection_button.addEventListener('click', ascii_draw.controllers.swap(SelectMoveController), false);
    }
    ascii_draw.init = init;
})(ascii_draw || (ascii_draw = {}));

window.addEventListener('load', ascii_draw.init, false);
