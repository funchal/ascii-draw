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
        
        Requires that other is inside this. You can use intersect to meet
        this requirement.
        
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
    (function (modes) {
        (function (SelectMoveMode) {
            function activate() {
                utils.addClass(selection_button, 'pressed');
            }
            SelectMoveMode.activate = activate;

            function deactivate() {
                utils.removeClass(selection_button, 'pressed');
            }
            SelectMoveMode.deactivate = deactivate;
        })(modes.SelectMoveMode || (modes.SelectMoveMode = {}));
        var SelectMoveMode = modes.SelectMoveMode;

        (function (RectangleMode) {
            function activate() {
                utils.addClass(rectangle_button, 'pressed');
            }
            RectangleMode.activate = activate;

            function deactivate() {
                utils.removeClass(rectangle_button, 'pressed');
            }
            RectangleMode.deactivate = deactivate;
        })(modes.RectangleMode || (modes.RectangleMode = {}));
        var RectangleMode = modes.RectangleMode;

        var selection_button;
        var rectangle_button;

        modes.current = SelectMoveMode;

        function change(new_mode) {
            modes.current.deactivate();
            modes.current = new_mode;
            modes.current.activate();
        }

        function init() {
            rectangle_button = document.getElementById('rectangle-button');
            selection_button = document.getElementById('selection-button');

            modes.current.activate();
            selection_button.addEventListener('click', change.bind(undefined, SelectMoveMode), false);
            rectangle_button.addEventListener('click', change.bind(undefined, RectangleMode), false);
        }
        modes.init = init;
    })(ascii_draw.modes || (ascii_draw.modes = {}));
    var modes = ascii_draw.modes;
})(ascii_draw || (ascii_draw = {}));
///<reference path='utils.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (commands) {
        var Rectangle = utils.Rectangle;
        var CellPosition = utils.Point;

        var history = [];
        var limit = 100;
        var current = 0;

        var redo_button;
        var undo_button;

        commands.pending = null;

        function init() {
            undo_button = document.getElementById('undo-button');
            redo_button = document.getElementById('redo-button');
            update();
            undo_button.addEventListener('click', onUndo, false);
            redo_button.addEventListener('click', onRedo, false);
        }
        commands.init = init;

        function complete(cmd) {
            commitSelection();
            history.splice(current, history.length - current, cmd);
            if (history.length > limit) {
                history.shift();
                current--;
            }
            current++;
            update();
        }
        commands.complete = complete;

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
            history[current].undo();
            update();
        }

        function redo() {
            current++;
            history[current - 1].redo();
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

        function commitSelection() {
            var selection_contents = ascii_draw.selection.contents;
            for (var i = 0; i < selection_contents.length; i++) {
                for (var r = 0; r < selection_contents[i].getHeight(); r++) {
                    var row = ascii_draw.grid.getRow(selection_contents[i].top + r);
                    for (var c = 0; c < selection_contents[i].getWidth(); c++) {
                        var cell = ascii_draw.grid.getCell(row, selection_contents[i].left + c);
                        cell['data-committed-content'] = cell.textContent;
                    }
                }
            }
        }
    })(ascii_draw.commands || (ascii_draw.commands = {}));
    var commands = ascii_draw.commands;
})(ascii_draw || (ascii_draw = {}));
'use strict';
var ascii_draw;
(function (ascii_draw) {
    (function (grid) {
        var CellPosition = utils.Point;

        grid.container;
        grid.nrows = 0;
        grid.ncols = 0;

        grid.emptyCell = ' ';

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
            for (var r = grid.nrows; r < new_nrows; r++) {
                grid.container.appendChild(document.createElement('div'));
            }

            for (var r = grid.nrows; r > new_nrows; r--) {
                grid.container.removeChild(grid.container.children[r]);
            }

            for (var r = 0; r < new_nrows; r++) {
                var row = getRow(r);
                for (var c = grid.ncols; c < new_ncols; c++) {
                    var cell = row.appendChild(document.createElement('span'));
                    writeToCell(cell, grid.emptyCell);
                }

                for (var c = grid.ncols; c > new_ncols; c--) {
                    row.removeChild(row.children[r]);
                }
            }

            grid.nrows = new_nrows;
            grid.ncols = new_ncols;

            ascii_draw.gridstatus.textContent = 'Grid size: ' + grid.nrows + 'x' + grid.ncols + ' (' + grid.nrows * grid.ncols + ')';
        }

        function changeFont() {
            utils.changeStyleRule('#grid span', 'width', 'auto');
            utils.changeStyleRule('#grid span', 'height', 'auto');
            utils.changeStyleRule('#grid div', 'height', 'auto');

            var font_size = utils.computeFontSize();

            // add 1 px to each dimension to compensate for borders
            var width = font_size.width + 1;
            var height = font_size.height + 1;

            utils.changeStyleRule('#grid span', 'width', width + 'px');
            utils.changeStyleRule('#grid span', 'height', height + 'px');
            utils.changeStyleRule('#grid div', 'height', height + 'px');
        }

        function writeToCell(cell, character) {
            cell.textContent = character;
        }
        grid.writeToCell = writeToCell;
    })(ascii_draw.grid || (ascii_draw.grid = {}));
    var grid = ascii_draw.grid;
})(ascii_draw || (ascii_draw = {}));
///<reference path='grid.ts'/>
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
///<reference path='selection.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;

    var SelectCommand = (function () {
        function SelectCommand() {
            this.saved_selection = [];
            this.completed = false;
        }
        SelectCommand.prototype.initiate = function (pos) {
            this.saved_selection = ascii_draw.selection.set([]);
            this.setHighlight(pos, pos);
        };

        SelectCommand.prototype.change = function (pos) {
            if (!this.completed) {
                this.setHighlight(ascii_draw.begin_highlight, pos);
            }
        };

        SelectCommand.prototype.complete = function () {
            var new_selection = new Rectangle(ascii_draw.begin_highlight, ascii_draw.end_highlight, true);
            ascii_draw.selection.set([new_selection]);
            this.setHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
            this.completed = true;
        };

        SelectCommand.prototype.cancel = function () {
        };

        SelectCommand.prototype.undo = function () {
            this.saved_selection = ascii_draw.selection.set(this.saved_selection);
        };

        SelectCommand.prototype.redo = function () {
            this.saved_selection = ascii_draw.selection.set(this.saved_selection);
        };

        SelectCommand.prototype.setHighlight = function (new_begin_highlight, new_end_highlight) {
            var new_highlight = new Rectangle(new_begin_highlight, new_end_highlight, true);
            var old_highlight = new Rectangle(ascii_draw.begin_highlight, ascii_draw.end_highlight, true);

            if (old_highlight.isEqual(new_highlight)) {
                return;
            }

            ascii_draw.begin_highlight = new_begin_highlight;
            ascii_draw.end_highlight = new_end_highlight;

            var keep = old_highlight.intersect(new_highlight);
            var clear = old_highlight.subtract(keep);
            var paint = new_highlight.subtract(keep);

            for (var i = 0; i < paint.length; i++) {
                ascii_draw.applyToRectangle(paint[i], ascii_draw.setHighlighted, true);
            }

            for (var i = 0; i < clear.length; i++) {
                ascii_draw.applyToRectangle(clear[i], ascii_draw.setHighlighted, false);
            }

            if (new_highlight.getHeight() > 1 || new_highlight.getWidth() > 1) {
                ascii_draw.selectionstatus.textContent = 'Highlight: ' + new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            } else {
                ascii_draw.selectionstatus.textContent = '';
            }
        };
        return SelectCommand;
    })();
    ascii_draw.SelectCommand = SelectCommand;
})(ascii_draw || (ascii_draw = {}));
'use strict';
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;

    var RectangleCommand = (function () {
        function RectangleCommand() {
            this.save_selection = [];
            this.completed = false;
        }
        RectangleCommand.prototype.initiate = function (pos) {
            // FIXME: set begin_selection at parent function
            this.save_selection = ascii_draw.selection.set([]);
            this.resetHighlight(pos);
            var cell = ascii_draw.grid.getCell(ascii_draw.grid.getRow(pos.row), pos.col);
            ascii_draw.grid.writeToCell(cell, '+');
            var selectionstatus = document.getElementById('selectionstatus');
            selectionstatus.textContent = 'Highlight: 1x1';
        };

        RectangleCommand.prototype.change = function (pos) {
            // FIXME: set end_selection at parent function
            if (!this.completed) {
                // FIXME: move this to parent function
                if (pos.isEqual(ascii_draw.end_highlight)) {
                    return;
                }

                this.updateRectangleAndHighlight(pos);

                ascii_draw.end_highlight = pos;

                // update status bar
                var new_highlight = new Rectangle(ascii_draw.begin_highlight, ascii_draw.end_highlight, true);
                var selectionstatus = document.getElementById('selectionstatus');
                selectionstatus.textContent = 'Highlight: ' + new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            }
        };

        RectangleCommand.prototype.complete = function () {
            var new_selection = this.resetHighlight(new CellPosition(0, 0));
            ascii_draw.selection.set(new_selection);
            this.completed = true;
        };

        RectangleCommand.prototype.cancel = function () {
        };

        RectangleCommand.prototype.undo = function () {
            this.save_selection = ascii_draw.selection.set(this.save_selection);
        };

        RectangleCommand.prototype.redo = function () {
            this.save_selection = ascii_draw.selection.set(this.save_selection);
        };

        RectangleCommand.prototype.fillArrayWithRectangle = function (array, rect) {
            for (var r = 0; r < ascii_draw.grid.nrows; r++) {
                array[r] = new Array(ascii_draw.grid.ncols);
                for (var c = 0; c < ascii_draw.grid.ncols; c++) {
                    array[r][c] = null;
                }
            }
            for (var c = rect.left + 1; c <= rect.right - 1; c++) {
                array[rect.top][c] = '-';
                array[rect.bottom][c] = '-';
            }
            for (var r = rect.top + 1; r <= rect.bottom - 1; r++) {
                array[r][rect.left] = '|';
                array[r][rect.right] = '|';
            }
            array[rect.top][rect.left] = '+';
            array[rect.bottom][rect.left] = '+';
            array[rect.top][rect.right] = '+';
            array[rect.bottom][rect.right] = '+';
        };

        /* Clear previous selection and paint new selection
        */
        RectangleCommand.prototype.updateRectangleAndHighlight = function (new_end_highlight) {
            var grid_old = new Array(ascii_draw.grid.nrows);
            this.fillArrayWithRectangle(grid_old, new Rectangle(ascii_draw.begin_highlight, ascii_draw.end_highlight, true));
            var grid_new = new Array(ascii_draw.grid.nrows);
            this.fillArrayWithRectangle(grid_new, new Rectangle(ascii_draw.begin_highlight, new_end_highlight, true));

            for (var r = 0; r < ascii_draw.grid.nrows; r++) {
                var row = null;
                for (var c = 0; c < ascii_draw.grid.ncols; c++) {
                    var old_content = grid_old[r][c];
                    var new_content = grid_new[r][c];
                    if (new_content == old_content) {
                        continue;
                    }
                    if (row == null) {
                        row = ascii_draw.grid.getRow(r);
                    }
                    var cell = ascii_draw.grid.getCell(row, c);
                    if (new_content == null) {
                        var character = cell['data-committed-content'];
                        ascii_draw.grid.writeToCell(cell, character);
                        ascii_draw.setHighlighted(cell, false);
                    } else {
                        ascii_draw.grid.writeToCell(cell, new_content);
                        if (old_content == null) {
                            ascii_draw.setHighlighted(cell, true);
                        }
                    }
                }
            }
        };

        RectangleCommand.prototype.resetHighlight = function (new_position) {
            // un-highlight previous selection
            var selection = this.getHollowRectangle(new Rectangle(ascii_draw.begin_highlight, ascii_draw.end_highlight, true));
            for (var i = 0; i < selection.length; i++) {
                ascii_draw.applyToRectangle(selection[i], ascii_draw.setHighlighted, false);
            }

            // update position
            ascii_draw.begin_highlight = new_position;
            ascii_draw.end_highlight = new_position;

            // highlight position
            var cell = ascii_draw.grid.getCell(ascii_draw.grid.getRow(new_position.row), new_position.col);
            ascii_draw.setHighlighted(cell, true);

            return selection;
        };

        RectangleCommand.prototype.getHollowRectangle = function (rect) {
            var inside_rect = new Rectangle(new CellPosition(rect.top + 1, rect.left + 1), new CellPosition(rect.bottom - 1, rect.right - 1));
            var surrounding = rect.subtract(inside_rect);
            return surrounding;
        };
        return RectangleCommand;
    })();
    ascii_draw.RectangleCommand = RectangleCommand;
})(ascii_draw || (ascii_draw = {}));
'use strict';
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;

    var FillCommand = (function () {
        function FillCommand() {
        }
        FillCommand.prototype.initiate = function (pos) {
        };
        FillCommand.prototype.change = function (pos) {
        };

        FillCommand.prototype.complete = function () {
            this.redo();
        };

        FillCommand.prototype.cancel = function () {
        };

        FillCommand.prototype.undo = function () {
            for (var i = 0; i < ascii_draw.selection.contents.length; i++) {
                ascii_draw.applyToRectangle(ascii_draw.selection.contents[i], ascii_draw.grid.writeToCell, ascii_draw.grid.emptyCell);
            }
        };

        FillCommand.prototype.redo = function () {
            for (var i = 0; i < ascii_draw.selection.contents.length; i++) {
                ascii_draw.applyToRectangle(ascii_draw.selection.contents[i], ascii_draw.grid.writeToCell, this.character);
            }
        };
        return FillCommand;
    })();
    ascii_draw.FillCommand = FillCommand;
})(ascii_draw || (ascii_draw = {}));
'use strict';
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;

    var TextCommand = (function () {
        function TextCommand() {
        }
        TextCommand.prototype.initiate = function (pos) {
        };
        TextCommand.prototype.change = function (pos) {
        };

        TextCommand.prototype.complete = function () {
            this.redo();
        };

        TextCommand.prototype.cancel = function () {
        };

        TextCommand.prototype.undo = function () {
            ascii_draw.selection.move(0, -1);
            for (var i = 0; i < ascii_draw.selection.contents.length; i++) {
                ascii_draw.applyToRectangle(ascii_draw.selection.contents[i], ascii_draw.grid.writeToCell, ascii_draw.grid.emptyCell);
            }
        };

        TextCommand.prototype.redo = function () {
            for (var i = 0; i < ascii_draw.selection.contents.length; i++) {
                ascii_draw.applyToRectangle(ascii_draw.selection.contents[i], ascii_draw.grid.writeToCell, this.character);
            }
            ascii_draw.selection.move(0, 1);
        };
        return TextCommand;
    })();
    ascii_draw.TextCommand = TextCommand;
})(ascii_draw || (ascii_draw = {}));
///<reference path='selection.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;

    var MoveCommand = (function () {
        function MoveCommand() {
            this.dx = 0;
            this.dy = 0;
            this.completed = false;
        }
        MoveCommand.prototype.initiate = function (pos) {
            ascii_draw.begin_highlight = pos;
            ascii_draw.end_highlight = pos;
        };

        MoveCommand.prototype.change = function (pos) {
            if (!this.completed) {
                this.dx = pos.row - ascii_draw.end_highlight.row;
                this.dy = pos.col - ascii_draw.end_highlight.col;
                ascii_draw.end_highlight = pos;
                ascii_draw.selection.move(this.dx, this.dy);
                // FIXME: move contents
            }
        };

        MoveCommand.prototype.complete = function () {
            this.dx = ascii_draw.end_highlight.row - ascii_draw.begin_highlight.row;
            this.dy = ascii_draw.end_highlight.col - ascii_draw.begin_highlight.col;
            this.completed = true;
        };

        MoveCommand.prototype.cancel = function () {
        };

        MoveCommand.prototype.undo = function () {
            ascii_draw.selection.move(-this.dx, -this.dy);
        };

        MoveCommand.prototype.redo = function () {
            ascii_draw.selection.move(this.dx, this.dy);
        };
        return MoveCommand;
    })();
    ascii_draw.MoveCommand = MoveCommand;
})(ascii_draw || (ascii_draw = {}));
///<reference path='utils.ts'/>
///<reference path='modes.ts'/>
///<reference path='commands.ts'/>
///<reference path='select_cmd.ts'/>
///<reference path='rectangle_cmd.ts'/>
///<reference path='fill_cmd.ts'/>
///<reference path='text_cmd.ts'/>
///<reference path='move_cmd.ts'/>
'use strict';
var ascii_draw;
(function (ascii_draw) {
    var Rectangle = utils.Rectangle;
    var CellPosition = utils.Point;

    var copypastearea;

    ascii_draw.gridstatus;
    ascii_draw.mousestatus;
    ascii_draw.selectionstatus;

    var mouse_pos = null;

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
            if (ascii_draw.commands.pending === null) {
                if (ascii_draw.selection.isUnit()) {
                    var cmd = new ascii_draw.TextCommand();
                    cmd.character = String.fromCharCode(event.charCode);
                    cmd.complete();
                    ascii_draw.commands.complete(cmd);
                } else {
                    var cmd = new ascii_draw.FillCommand();
                    cmd.character = String.fromCharCode(event.charCode);
                    cmd.complete();
                    ascii_draw.commands.complete(cmd);
                }
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
                //controllers.current.onArrowDown(displacement);
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

    function setHighlighted(cell, highlighted) {
        if (cell['data-highlighted'] !== highlighted) {
            cell['data-highlighted'] = highlighted;
            if (highlighted) {
                utils.addClass(cell, 'highlighted');
            } else {
                utils.removeClass(cell, 'highlighted');
            }
        } else {
            //console.log('highlighted already set to ' + highlighted);
        }
    }
    ascii_draw.setHighlighted = setHighlighted;

    ascii_draw.begin_highlight = new CellPosition(0, 0);
    ascii_draw.end_highlight = ascii_draw.begin_highlight;

    function onMouseDown(event) {
        var target = ascii_draw.grid.getTargetCell(event.target);
        if (target !== null) {
            var pos = ascii_draw.grid.getCellPosition(target);
            if (target['data-selected'] === true) {
                ascii_draw.commands.pending = new ascii_draw.MoveCommand();
            } else {
                if (ascii_draw.modes.current == ascii_draw.modes.SelectMoveMode) {
                    ascii_draw.commands.pending = new ascii_draw.SelectCommand();
                } else if (ascii_draw.modes.current == ascii_draw.modes.RectangleMode) {
                    ascii_draw.commands.pending = new ascii_draw.RectangleCommand();
                }
            }
            ascii_draw.commands.pending.initiate(pos);
        }

        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event) {
        var target = ascii_draw.grid.getTargetCell(event.target);
        if (target !== null) {
            var pos = ascii_draw.grid.getCellPosition(target);
            setMousePosition(pos);
            if (ascii_draw.commands.pending !== null) {
                window.setTimeout(ascii_draw.commands.pending.change.bind(ascii_draw.commands.pending, pos), 0);
            }
        }

        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event) {
        if (ascii_draw.commands.pending !== null) {
            var target = ascii_draw.grid.getTargetCell(event.target);
            if (target !== null) {
                var pos = ascii_draw.grid.getCellPosition(target);
                ascii_draw.commands.pending.change(pos);
            }
            ascii_draw.commands.pending.complete();
            ascii_draw.commands.complete(ascii_draw.commands.pending);
            ascii_draw.commands.pending = null;
        }

        event.stopPropagation();
        event.preventDefault();
    }

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

    function onMouseLeave(event) {
        setMousePosition(null);
        event.stopPropagation();
        event.preventDefault();
    }

    function onContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    function init() {
        copypastearea = document.getElementById('copypastearea');
        ascii_draw.gridstatus = document.getElementById('gridstatus');
        ascii_draw.selectionstatus = document.getElementById('selectionstatus');
        ascii_draw.mousestatus = document.getElementById('mousestatus');

        ascii_draw.grid.init();
        ascii_draw.modes.init();
        ascii_draw.commands.init();

        ascii_draw.grid.container.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        ascii_draw.grid.container.addEventListener('mouseover', onMouseOver, false);
        ascii_draw.grid.container.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);
    }
    ascii_draw.init = init;
})(ascii_draw || (ascii_draw = {}));

window.addEventListener('load', ascii_draw.init, false);
