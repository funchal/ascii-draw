///<reference path='utils.ts'/>
///<reference path='grid.ts'/>
///<reference path='selection.ts'/>
///<reference path='commands.ts'/>

'use strict';

module ascii_draw {
    export module controllers {
        import Rectangle = utils.Rectangle;
        import CellPosition = utils.Point;
        import Cell = grid.Cell;

        export interface Controller {
            activate(): void;
            deactivate(): void;
            onMouseDown(target: Cell): void;
            onMouseUp(): void;
            onMouseOver(target: Cell): void;
            onMouseLeave(): void;
            onArrowDown(displacement: Array<number>): void;
            onKeyPress(character: string): void;
        }

        export module RectangleController {
            export function activate(): void {
                console.log('activate RectangleController');
                utils.addClass(rectangle_button, 'pressed');
            }

            export function deactivate(): void {
                console.log('deactivate RectangleController');
                utils.removeClass(rectangle_button, 'pressed');
            }

            export function onMouseDown(target: Cell): void {
                // TODO: if current cell is highlighted change to move mode
                highlighting = true;
                setHollowHighlight(grid.getCellPosition(target), grid.getCellPosition(target));
                writeToCell(target, '+');
            }

            export function onMouseUp(): void {
                if (highlighting) {
                    var new_selection = setHollowHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
                    highlighting = false;

                    commands.invoke(new commands.ReplaceSelection(new_selection));
                }
            }

            export function onMouseOver(target: Cell): void {
                var pos = grid.getCellPosition(target);
                setMousePosition(pos);
                if (highlighting) {
                    updateRectangleAndHighlight(pos);
                }
            }

            export function onMouseLeave(): void {
                setMousePosition(null);
            }

            export function onArrowDown(displacement: Array<number>): void {
                if (highlighting) {
                    return;
                }

                /* this should really be implemented by a MoveController */
                selection.move(displacement[0], displacement[1]);
            }

            export function onKeyPress(character: string): void {
                if (highlighting) {
                    return;
                }

                commands.invoke(new commands.FillSelection(character));
            }

            /*
            requires change[0] <= change[1]
            */
            function updateInterval(row: number,
                                    change: Array<number>,
                                    horizontal: boolean,
                                    clear: boolean)
            {
                var rect: Rectangle;
                var character: string;
                if (horizontal) {
                    character = '-';
                    rect = new Rectangle(new CellPosition(row, change[0]),
                                         new CellPosition(row, change[1]));
                } else {
                    character = '|';
                    rect = new Rectangle(new CellPosition(change[0], row),
                                         new CellPosition(change[1], row));
                }
                if (clear) {
                    character = emptyCell;
                }
                applyToRectangle(rect,
                                 function(cell: Cell, highlighted: boolean) {
                                     writeToCell(cell, character);
                                     setHighlighted(cell, !clear);},
                                 true);
            }

            function updateInnerLine(row: number,
                                     begin_col: number,
                                     end_col: number,
                                     horizontal: boolean,
                                     clear: boolean): void
            {
                var change = [Math.min(begin_col, end_col) + 1,
                              Math.max(begin_col, end_col) - 1];

                updateInterval(row, change, horizontal, clear);
            }

            /* Clear or paint the cells on row 'row' that are between columns
            'begin' and 'change_col' but not between columns 'begin' and
            'keep_col'.

            All 3 examples assume horizontal = true and clear = true.

              Before call:                            After call:

        begin_col keep_col change_col           begin_col keep_col change_col

            |        |          |                   |        |          |
            v        v          v                   v        v          v

    row ->  +-------------------+           row ->  +--------           +



       begin_col change_col keep_col           begin_col change_col keep_col

            |        |          |                   |        |          |
            v        v          v                   v        v          v

    row ->  +--------+                      row ->  +--------+



         keep_col change_col change_col          keep_col change_col change_col

             |        |          |                   |        |          |
             v        v          v                   v        v          v

     row ->           +----------+           row ->           +          +

            */
            function updateAdjacentEdge(row: number,
                                        begin_col: number,
                                        keep_col: number,
                                        change_col: number,
                                        horizontal: boolean,
                                        clear: boolean): void
            {
                var change: Array<number>;
                if (change_col < begin_col && change_col < keep_col) {
                    change = [change_col + 1, Math.min(begin_col - 1, keep_col)];
                } else if (change_col > begin_col && change_col > keep_col) {
                    change = [Math.max(begin_col + 1, keep_col), change_col - 1];
                } // else change_col is between begin_col and keep_col, nothing to change.

                if (change && change[0] <= change[1]) {
                    updateInterval(row, change, horizontal, clear);
                }
            }


            function updateOppositeEdge(begin_col: number,
                                        keep_row: number,
                                        keep_col: number,
                                        change_row: number,
                                        change_col: number,
                                        horizontal: boolean,
                                        clear: boolean): void
            {
                if (keep_row == change_row) {
                    // The edge is still on the same row. Need to update
                    // only the part of the edge that changed. Use the same
                    // algorithm as for adjacent edges.
                    updateAdjacentEdge(keep_row,
                                       begin_col,
                                       keep_col,
                                       change_col,
                                       horizontal,
                                       clear);
                } else {
                    // Easy case: the edge is on a new row. Update the
                    // entire edge.
                    updateInnerLine(change_row,
                                    begin_col,
                                    change_col,
                                    horizontal,
                                    clear);
                }
            }

            function updateCorners(begin: CellPosition,
                                   end: CellPosition,
                                   clear: boolean): void
            {
                var character: string;
                if (clear) {
                    character = emptyCell;
                } else {
                    character = '+';
                }

                var row = grid.getRow(begin.row);

                var cell = grid.getCell(row, begin.col);
                writeToCell(cell, character);
                setHighlighted(cell, !clear);

                cell = grid.getCell(row, end.col);
                writeToCell(cell, character);
                setHighlighted(cell, !clear);

                row = grid.getRow(end.row);

                cell = grid.getCell(row, begin.col);
                writeToCell(cell, character);
                setHighlighted(cell, !clear);

                cell = grid.getCell(row, end.col);
                writeToCell(cell, character);
                setHighlighted(cell, !clear);

            }

            function updateRectangleAndHighlight(new_end_highlight: CellPosition): Array<Rectangle>
            {

                if (new_end_highlight.isEqual(end_highlight)) {
                    return;
                }

                // clear

                updateCorners(begin_highlight, end_highlight, true /* clear */);

                updateAdjacentEdge(begin_highlight.row,
                                   begin_highlight.col,
                                   new_end_highlight.col,
                                   end_highlight.col,
                                   true, /* horizontal */
                                   true /* clear */);

                updateAdjacentEdge(begin_highlight.col,
                                   begin_highlight.row,
                                   new_end_highlight.row,
                                   end_highlight.row,
                                   false, /* horizontal */
                                   true /* clear */);

                // don't clear the opposite edge if it overlaps with the adjacent edge
                if (begin_highlight.row != end_highlight.row) {
                    updateOppositeEdge(begin_highlight.col,
                                       new_end_highlight.row,
                                       new_end_highlight.col,
                                       end_highlight.row,
                                       end_highlight.col,
                                       true /* horizontal */,
                                       true /* clear */);
                }

                // don't clear the opposite edge if it overlaps with the adjacent edge
                if (begin_highlight.col != end_highlight.col) {
                    updateOppositeEdge(begin_highlight.row,
                                       new_end_highlight.col,
                                       new_end_highlight.row,
                                       end_highlight.col,
                                       end_highlight.row,
                                       false, /* horizontal */
                                       true /* clear */);
                }

                // paint

                updateAdjacentEdge(begin_highlight.row,
                                   begin_highlight.col,
                                   end_highlight.col,
                                   new_end_highlight.col,
                                   true, /* horizontal */
                                   false /* clear */);

                updateAdjacentEdge(begin_highlight.col,
                                   begin_highlight.row,
                                   end_highlight.row,
                                   new_end_highlight.row,
                                   false, /* horizontal */
                                   false /* clear */);

                updateOppositeEdge(begin_highlight.col,
                                   end_highlight.row,
                                   end_highlight.col,
                                   new_end_highlight.row,
                                   new_end_highlight.col,
                                   true /* horizontal */,
                                   false /* clear */);

                updateOppositeEdge(begin_highlight.row,
                                   end_highlight.col,
                                   end_highlight.row,
                                   new_end_highlight.col,
                                   new_end_highlight.row,
                                   false, /* horizontal */
                                   false /* clear */);

                updateCorners(begin_highlight, new_end_highlight, false);

                end_highlight = new_end_highlight;
            }
        }

        export module SelectMoveController {
            export function activate(): void {
                console.log('activate SelectMoveController');
                utils.addClass(selection_button, 'pressed');
            }

            export function deactivate(): void {
                console.log('deactivate SelectMoveController');
                utils.removeClass(selection_button, 'pressed');
            }

            export function onMouseDown(target: Cell): void {
                // TODO: if current cell is highlighted change to move mode
                highlighting = true;
                setHighlight(grid.getCellPosition(target), grid.getCellPosition(target));
            }

            export function onMouseUp(): void {
                if (highlighting) {
                    var new_selection = new Rectangle(begin_highlight, end_highlight, true /*normalize*/);
                    setHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
                    highlighting = false;

                    commands.invoke(new commands.ReplaceSelection([new_selection]));
                }
            }

            export function onMouseOver(target: Cell): void {
                var pos = grid.getCellPosition(target);
                setMousePosition(pos);
                if (highlighting) {
                    setHighlight(begin_highlight, pos);
                }
            }

            export function onMouseLeave(): void {
                setMousePosition(null);
            }

            export function onArrowDown(displacement: Array<number>): void {
                if (highlighting) {
                    return;
                }

                /* this should really be implemented by a MoveController */
                selection.move(displacement[0], displacement[1]);
            }

            export function onKeyPress(character: string): void {
                if (highlighting) {
                    return;
                }

                commands.invoke(new commands.FillSelection(character));
            }
        }

        export var begin_highlight: CellPosition = new CellPosition(0, 0);
        export var end_highlight: CellPosition = begin_highlight;

        var highlighting = false;
        var mouse_pos: CellPosition = null;

        export var current: Controller = SelectMoveController;

        export function swap(new_controller: Controller): () => void {
            return function(): void {
                current.deactivate();
                current = new_controller;
                current.activate();
            }
        }

        export function init() : void {
            current.activate();
            selection.clear();
            selection.add(new Rectangle(begin_highlight, end_highlight, true /*normalize*/));
        }

        function setMousePosition(new_pos: CellPosition): void {
            if (mouse_pos !== null) {
                var cell = grid.getCell(grid.getRow(mouse_pos.row), mouse_pos.col);
                utils.removeClass(cell, 'mouse');
            }
            mouse_pos = new_pos;

            var mousestatus = document.getElementById('mousestatus');
            if (mouse_pos !== null) {
                var cell = grid.getCell(grid.getRow(mouse_pos.row), mouse_pos.col);
                utils.addClass(cell, 'mouse');
                mousestatus.textContent = 'Cursor: ' + mouse_pos;
            } else {
                mousestatus.textContent = '';
            }
        }

        export function setHighlight(new_begin_highlight: CellPosition,
                                     new_end_highlight: CellPosition): void {
            var new_highlight = new Rectangle(new_begin_highlight,
                                              new_end_highlight,
                                              true /*normalize*/);
            var old_highlight = new Rectangle(begin_highlight,
                                              end_highlight,
                                              true /*normalize*/);

            if (old_highlight.isEqual(new_highlight)) {
                return;
            }

            begin_highlight = new_begin_highlight;
            end_highlight = new_end_highlight;

            var keep = old_highlight.intersect(new_highlight);
            var clear = old_highlight.subtract(keep);
            var paint = new_highlight.subtract(keep);

            for (var i = 0; i < paint.length; i++) {
                applyToRectangle(paint[i], setHighlighted, true);
            }

            for (var i = 0; i < clear.length; i++) {
                applyToRectangle(clear[i], setHighlighted, false);
            }

            if (new_highlight.getHeight() > 1 || new_highlight.getWidth() > 1) {
                selectionstatus.textContent = 'Highlight: ' +
                new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            } else {
                selectionstatus.textContent = '';
            }
        }

        function getHollowRectangle(rect: Rectangle): Array<Rectangle> {
            var inside_rect = new Rectangle(
                    new CellPosition(rect.top + 1,
                                     rect.left + 1),
                    new CellPosition(rect.bottom - 1,
                                     rect.right - 1));
            var surrounding = rect.subtract(inside_rect);
            return surrounding;
        }

        function setHollowHighlight(new_begin_highlight: CellPosition,
                                    new_end_highlight: CellPosition): Array<Rectangle> {
            var new_highlight = new Rectangle(new_begin_highlight,
                                              new_end_highlight,
                                              true /*normalize*/);
            var old_highlight = new Rectangle(begin_highlight,
                                              end_highlight,
                                              true /*normalize*/);

            if (old_highlight.isEqual(new_highlight)) {
                return;
            }

            begin_highlight = new_begin_highlight;
            end_highlight = new_end_highlight;

            var old_pieces = getHollowRectangle(old_highlight);
            for (var piece = 0; piece < old_pieces.length; piece++) {
                applyToRectangle(old_pieces[piece], setHighlighted, false);
            }

            var new_pieces = getHollowRectangle(new_highlight);
            for (var piece = 0; piece < new_pieces.length; piece++) {
                applyToRectangle(new_pieces[piece], setHighlighted, true);
            }

            var selectionstatus = document.getElementById('selectionstatus');
            if (new_highlight.getHeight() > 1 || new_highlight.getWidth() > 1) {
                selectionstatus.textContent = 'Highlight: ' +
                    new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            } else {
                selectionstatus.textContent = '';
            }

            return old_pieces;
        }

        export function writeToCell(cell: Cell, character: string): void {
            cell.textContent = character;
        }

        function setHighlighted(cell: Cell, highlighted: boolean): void {
            if (cell['data-highlighted'] !== highlighted) {
                cell['data-highlighted'] = highlighted;
                if (highlighted) {
                    utils.addClass(cell, 'highlighted');
                } else {
                    utils.removeClass(cell, 'highlighted');
                }
            } else {
                console.log('highlighted already set to ' + highlighted);
            }
        }
    }
}
