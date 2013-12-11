///<reference path='utils.ts'/>

'use strict';

module ascii_draw {
    export module controllers {

        import Rectangle = utils.Rectangle;
        import CellPosition = utils.Point;

        var selecting = false;
        var mouse_pos: CellPosition = null;

        export interface Controller {
            init(): void;
            reset(): void;
            onMouseDown(target: HTMLTableCellElement): void;
            onMouseUp(): void;
            onMouseOver(target: HTMLTableCellElement): void;
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

            export function onMouseDown(target: HTMLTableCellElement): void {
                // TODO: if current cell is selected change to move mode
                selecting = true;
                setHollowSelection(getCellPosition(target), getCellPosition(target));
                drawRectangle(new Rectangle(begin_selection, end_selection, true /*normalize*/));
            }

            export function onMouseUp(): void {
                selecting = false;
            }

            export function onMouseOver(target: HTMLTableCellElement): void {
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
                    applyToRectangle(rect_pieces[piece],
                                     function(cell: HTMLTableCellElement) {
                                        writeToCell(cell, character);
                                     });
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
                var first_row = <HTMLTableRowElement>grid.rows[top];
                writeToCell(<HTMLTableCellElement>first_row.cells[left], '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(<HTMLTableCellElement>first_row.cells[col], '-');
                }
                writeToCell(<HTMLTableCellElement>first_row.cells[right], '+');

                // print intermediate rows: |   |
                for (var row = top + 1; row <= bottom - 1; row++) {
                    var current_row = <HTMLTableRowElement>grid.rows[row];
                    writeToCell(<HTMLTableCellElement>current_row.cells[left], '|');
                    writeToCell(<HTMLTableCellElement>current_row.cells[right], '|');
                }

                // print last row
                var last_row = <HTMLTableRowElement>grid.rows[bottom];
                writeToCell(<HTMLTableCellElement>last_row.cells[left], '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(<HTMLTableCellElement>last_row.cells[col], '-');
                }
                writeToCell(<HTMLTableCellElement>last_row.cells[right], '+');
            }
        }

        export module SelectMoveController {
            export function init(): void {
                reset();
                begin_selection = new CellPosition(0, 0);
                end_selection = begin_selection;
                setSelected(getCellAt(begin_selection), true);
            }

            export function reset(): void {
                utils.addClass(selection_button, 'pressed');
            }

            export function onMouseDown(target: HTMLTableCellElement): void {
                // TODO: if current cell is selected change to move mode
                selecting = true;
                setSelection(getCellPosition(target), getCellPosition(target));
            }

            export function onMouseUp(): void {
                selecting = false;
            }

            export function onMouseOver(target: HTMLTableCellElement): void {
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
                                 function(cell: HTMLTableCellElement) {
                                    writeToCell(cell, character);
                                 });
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
                utils.removeClass(getCellAt(mouse_pos), 'mouse');
            }
            mouse_pos = new_pos;

            var mousestatus = document.getElementById('mousestatus');
            if (mouse_pos !== null) {
                utils.addClass(getCellAt(mouse_pos), 'mouse');
                mousestatus.textContent = 'Cursor: ' + mouse_pos;
            } else {
                mousestatus.textContent = '';
            }
        }

        function setSelection(new_begin_selection: CellPosition,
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
            var top = rect.top_left.row;
            var left = rect.top_left.col;
            var bottom = rect.bottom_right.row;
            var right = rect.bottom_right.col;

            /* Build up to 4 rectangles depending on the dimentions of the
             * surrounding rectangle: top (T), bottom (B), left (L), right (R).
             * Examples:
             *
             *   TTTT  TT  T
             *   L  R  LR  L
             *   L  R  LR  L
             *   BBBB  BB  B
             *
             *   TTTT  TT  T
             *   BBBB  BB  B
             *
             *   TTTT  TT  T
             */

            var rect_pieces: Array<Rectangle> = [];

            if (rect.isEmpty()) {
                return rect_pieces;
            }

            // top
            rect_pieces.push(new Rectangle(new CellPosition(top, left),
                                           new CellPosition(top, right)));

            if (rect.getHeight() > 1) {
                // bottom
                rect_pieces.push(new Rectangle(new CellPosition(bottom, left),
                                               new CellPosition(bottom, right)));

                if (rect.getHeight() > 2) {
                    // left
                    rect_pieces.push(new Rectangle(new CellPosition(top+1, left),
                                                   new CellPosition(bottom-1, left)));

                    if (rect.getWidth() > 1) {
                        // right
                        rect_pieces.push(new Rectangle(new CellPosition(top+1, right),
                                                       new CellPosition(bottom-1, right)));
                    }
                }
            }

            return rect_pieces;
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

        function writeToCell(cell: HTMLTableCellElement, character: string): void {
            cell.children[0].textContent = character;
        }
    }
}
