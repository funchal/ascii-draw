///<reference path='utils.ts'/>

'use strict';

module ascii_draw {
    export module controllers {

        import Rectangle = utils.Rectangle;
        import CellPosition = utils.Point;

        export var begin_selection: CellPosition;
        export var end_selection: CellPosition;

        var selecting = false;
        var mouse_pos: CellPosition = null;

        export interface Controller {
            init(): void;
            reset(): void;
            onMouseDown(target: Cell): void;
            onMouseUp(): void;
            onMouseOver(target: Cell): void;
            onMouseLeave(): void;
            onArrowDown(displacement: Array<number>): void;
            onKeyPress(character: string): void;
            exit(): void;
        }

        export module RectangleController {
            export function init(): void {
                console.log('init');
                reset();
            }

            export function reset(): void {
                console.log('reset');
                utils.addClass(rectangle_button, 'pressed');
            }

            export function onMouseDown(target: Cell): void {
                // TODO: if current cell is selected change to move mode
                selecting = true;
                setHollowSelection(getCellPosition(target), getCellPosition(target));
                drawRectangle(new Rectangle(begin_selection, end_selection, true /*normalize*/));
            }

            export function onMouseUp(): void {
                selecting = false;
            }

            export function onMouseOver(target: Cell): void {
                var pos = getCellPosition(target);
                setMousePosition(pos);
                if (selecting) {
                    setHollowSelection(begin_selection, pos);
                    drawRectangle(new Rectangle(begin_selection, end_selection, true /*normalize*/));
                }
            }

            export function onMouseLeave(): void {
                setMousePosition(null);
            }

            export function onArrowDown(displacement: Array<number>): void {
                // Do nothing
            }

            export function onKeyPress(character: string): void {
                var rect_pieces = getHollowRectangle(new Rectangle(begin_selection, end_selection, true /*normalize*/));
                for (var piece = 0; piece < rect_pieces.length; piece++) {
                    applyToRectangle(rect_pieces[piece], writeToCell, character);
                }
                if (begin_selection.isEqual(end_selection)) {
                    var displacement = [0, 1];
                    var pos = new CellPosition(begin_selection.row + displacement[0],
                                               begin_selection.col + displacement[1]);
                    setSelection(pos, pos);
                }
            }

            export function exit(): void {
                console.log('exit');
                utils.removeClass(rectangle_button, 'pressed');
                setHollowSelection(begin_selection, begin_selection);
            }

            function drawRectangle(rect: Rectangle):void {
                var top = rect.top_left.row;
                var left = rect.top_left.col;
                var bottom = rect.bottom_right.row;
                var right = rect.bottom_right.col;

                // print first row: +---+
                var first_row = getRow(top);
                writeToCell(getCell(left, first_row), '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(getCell(col, first_row), '-');
                }
                writeToCell(getCell(right, first_row), '+');

                // print intermediate rows: |   |
                for (var row = top + 1; row <= bottom - 1; row++) {
                    var current_row = getRow(row);
                    writeToCell(getCell(left, current_row), '|');
                    writeToCell(getCell(right, current_row), '|');
                }

                // print last row
                var last_row = getRow(bottom);
                writeToCell(getCell(left, last_row), '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(getCell(col, last_row), '-');
                }
                writeToCell(getCell(right, last_row), '+');
            }
        }

        export module SelectMoveController {
            export function init(): void {
                reset();
                begin_selection = new CellPosition(0, 0);
                end_selection = begin_selection;
                setSelected(getCell(begin_selection.col, getRow(begin_selection.row)), true);
            }

            export function reset(): void {
                utils.addClass(selection_button, 'pressed');
            }

            export function onMouseDown(target: Cell): void {
                // TODO: if current cell is selected change to move mode
                selecting = true;
                setSelection(getCellPosition(target), getCellPosition(target));
            }

            export function onMouseUp(): void {
                if (selecting) {
                    //commands.invoke(new ChangeSelection(begin_selection, end_selection));
                    selecting = false;
                }
            }

            export function onMouseOver(target: Cell): void {
                var pos = getCellPosition(target);
                setMousePosition(pos);
                if (selecting) {
                    setSelection(begin_selection, pos);
                }
            }

            export function onMouseLeave(): void {
                setMousePosition(null);
            }

            export function onArrowDown(displacement: Array<number>): void {
                var pos = new CellPosition(begin_selection.row + displacement[0],
                           begin_selection.col + displacement[1]);
                setSelection(pos, pos);

            }
            export function onKeyPress(character: string): void {
                applyToRectangle(new Rectangle(begin_selection, end_selection, true /*normalize*/),
                                 writeToCell, character);
                if (begin_selection.isEqual(end_selection)) {
                    var displacement = [0, 1];
                    var pos = new CellPosition(begin_selection.row + displacement[0],
                                               begin_selection.col + displacement[1]);
                    setSelection(pos, pos);
                }
            }

            export function exit(): void {
                utils.removeClass(selection_button, 'pressed');
                setSelection(begin_selection, begin_selection);
            }
        }

        function setMousePosition(new_pos: CellPosition): void {
            if (mouse_pos !== null) {
                var cell = getCell(mouse_pos.col, getRow(mouse_pos.row));
                utils.removeClass(cell, 'mouse');
            }
            mouse_pos = new_pos;

            var mousestatus = document.getElementById('mousestatus');
            if (mouse_pos !== null) {
                var cell = getCell(mouse_pos.col, getRow(mouse_pos.row));
                utils.addClass(cell, 'mouse');
                mousestatus.textContent = 'Cursor: ' + mouse_pos;
            } else {
                mousestatus.textContent = '';
            }
        }

        export function setSelection(new_begin_selection: CellPosition,
                                     new_end_selection: CellPosition): void {
            var new_selection = new Rectangle(new_begin_selection,
                                              new_end_selection,
                                              true /*normalize*/);
            var old_selection = new Rectangle(begin_selection,
                                              end_selection,
                                              true /*normalize*/);

            if (old_selection.isEqual(new_selection)) {
                return;
            }

            begin_selection = new_begin_selection;
            end_selection = new_end_selection;

            var keep = old_selection.intersect(new_selection);
            var clear = old_selection.subtract(keep);
            var paint = new_selection.subtract(keep);

            for (var i = 0; i < paint.length; i++) {
                applyToRectangle(paint[i], setSelected, true);
            }

            for (var i = 0; i < clear.length; i++) {
                applyToRectangle(clear[i], setSelected, false);
            }

            if (new_selection.getHeight() > 1 || new_selection.getWidth() > 1) {
                selectionstatus.textContent = 'Selection: ' +
                new_selection.getHeight() + 'x' + new_selection.getWidth();
            } else {
                selectionstatus.textContent = '';
            }
        }

        function getHollowRectangle(rect: Rectangle): Array<Rectangle> {
            var inside_rect = new Rectangle(
                    new CellPosition(rect.top_left.row + 1,
                                     rect.top_left.col + 1),
                    new CellPosition(rect.bottom_right.row - 1,
                                     rect.bottom_right.col - 1));
            var surrounding = rect.subtract(inside_rect);
            return surrounding;
        }

        function setHollowSelection(new_begin_selection: CellPosition,
                                    new_end_selection: CellPosition): void {
            var new_selection = new Rectangle(new_begin_selection,
                                              new_end_selection,
                                              true /*normalize*/);
            var old_selection = new Rectangle(begin_selection,
                                              end_selection,
                                              true /*normalize*/);

            if (old_selection.isEqual(new_selection)) {
                return;
            }

            begin_selection = new_begin_selection;
            end_selection = new_end_selection;

            var rect_pieces = getHollowRectangle(old_selection);
            for (var piece = 0; piece < rect_pieces.length; piece++) {
                applyToRectangle(rect_pieces[piece], setSelected, false);
            }
            rect_pieces = getHollowRectangle(new_selection);
            for (var piece = 0; piece < rect_pieces.length; piece++) {
                applyToRectangle(rect_pieces[piece], setSelected, true);
            }
            var selectionstatus = document.getElementById('selectionstatus');
            if (new_selection.getHeight() > 1 || new_selection.getWidth() > 1) {
                selectionstatus.textContent = 'Selection: ' +
                    new_selection.getHeight() + 'x' + new_selection.getWidth();
            } else {
                selectionstatus.textContent = '';
            }
        }

        function writeToCell(cell: Cell, character: string): void {
            cell.textContent = character;
        }
    }
}
