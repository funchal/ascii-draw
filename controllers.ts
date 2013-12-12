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
        import Command = commands.Command;

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
                // TODO: if current cell is highlighted change to move mode
                highlighting = true;
                setHollowHighlight(grid.getCellPosition(target), grid.getCellPosition(target));
                drawRectangle(new Rectangle(begin_highlight, end_highlight, true /*normalize*/));
            }

            export function onMouseUp(): void {
                highlighting = false;
            }

            export function onMouseOver(target: Cell): void {
                var pos = grid.getCellPosition(target);
                setMousePosition(pos);
                if (highlighting) {
                    setHollowHighlight(begin_highlight, pos);
                    drawRectangle(new Rectangle(begin_highlight, end_highlight, true /*normalize*/));
                }
            }

            export function onMouseLeave(): void {
                setMousePosition(null);
            }

            export function onArrowDown(displacement: Array<number>): void {
                // Do nothing
            }

            export function onKeyPress(character: string): void {
                var rect_pieces = getHollowRectangle(new Rectangle(begin_highlight, end_highlight, true /*normalize*/));
                for (var piece = 0; piece < rect_pieces.length; piece++) {
                    applyToRectangle(rect_pieces[piece], writeToCell, character);
                }
                if (begin_highlight.isEqual(end_highlight)) {
                    var displacement = [0, 1];
                    var pos = new CellPosition(begin_highlight.row + displacement[0],
                                               begin_highlight.col + displacement[1]);
                    setHighlight(pos, pos);
                }
            }

            export function exit(): void {
                console.log('exit');
                utils.removeClass(rectangle_button, 'pressed');
                setHollowHighlight(begin_highlight, begin_highlight);
            }

            function drawRectangle(rect: Rectangle):void {
                var top = rect.top_left.row;
                var left = rect.top_left.col;
                var bottom = rect.bottom_right.row;
                var right = rect.bottom_right.col;

                // print first row: +---+
                var first_row = grid.getRow(top);
                writeToCell(grid.getCell(first_row, left), '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(grid.getCell(first_row, col), '-');
                }
                writeToCell(grid.getCell(first_row, right), '+');

                // print intermediate rows: |   |
                for (var row = top + 1; row <= bottom - 1; row++) {
                    var current_row = grid.getRow(row);
                    writeToCell(grid.getCell(current_row, left), '|');
                    writeToCell(grid.getCell(current_row, right), '|');
                }

                // print last row
                var last_row = grid.getRow(bottom);
                writeToCell(grid.getCell(last_row, left), '+');
                for (var col = left + 1; col <= right - 1; col++) {
                    writeToCell(grid.getCell(last_row, col), '-');
                }
                writeToCell(grid.getCell(last_row, right), '+');
            }
        }

        export module SelectMoveController {
            export function init(): void {
                reset();
                begin_highlight = new CellPosition(0, 0);
                end_highlight = begin_highlight;
                selection.clear();
                selection.add(new Rectangle(begin_highlight, end_highlight, true /*normalize*/));
            }

            export function reset(): void {
                utils.addClass(selection_button, 'pressed');
            }

            export function onMouseDown(target: Cell): void {
                // TODO: if current cell is highlighted change to move mode
                highlighting = true;
                setHighlight(grid.getCellPosition(target), grid.getCellPosition(target));
            }

            class ReplaceSelection implements Command {
                constructor(public save_selection: Array<Rectangle>) {}

                execute(): void {
                    console.log('ReplaceSelection execute');
                    this.save_selection = selection.set(this.save_selection);
                }

                unexecute(): void {
                    console.log('ReplaceSelection unexecute');
                    this.save_selection = selection.set(this.save_selection);
                }
            }

            export function onMouseUp(): void {
                if (highlighting) {
                    var new_selection = new Rectangle(begin_highlight, end_highlight, true /*normalize*/);
                    setHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
                    highlighting = false;

                    commands.invoke(new ReplaceSelection([new_selection]));
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
                var pos = new CellPosition(begin_highlight.row + displacement[0],
                           begin_highlight.col + displacement[1]);
                setHighlight(pos, pos);

            }
            export function onKeyPress(character: string): void {
                applyToRectangle(new Rectangle(begin_highlight, end_highlight, true /*normalize*/),
                                 writeToCell, character);
                if (begin_highlight.isEqual(end_highlight)) {
                    var displacement = [0, 1];
                    var pos = new CellPosition(begin_highlight.row + displacement[0],
                                               begin_highlight.col + displacement[1]);
                    setHighlight(pos, pos);
                }
            }

            export function exit(): void {
                utils.removeClass(selection_button, 'pressed');
                setHighlight(begin_highlight, begin_highlight);
            }
        }

        export var begin_highlight: CellPosition;
        export var end_highlight: CellPosition;

        var highlighting = false;
        var mouse_pos: CellPosition = null;

        export var current: Controller = SelectMoveController;

        export function swap(new_controller: Controller): () => void {
            return function(): void {
                current.exit();
                current = new_controller;
                current.reset();
            }
        }

        export function init() : void {
            current.init();
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
                    new CellPosition(rect.top_left.row + 1,
                                     rect.top_left.col + 1),
                    new CellPosition(rect.bottom_right.row - 1,
                                     rect.bottom_right.col - 1));
            var surrounding = rect.subtract(inside_rect);
            return surrounding;
        }

        function setHollowHighlight(new_begin_highlight: CellPosition,
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

            var rect_pieces = getHollowRectangle(old_highlight);
            for (var piece = 0; piece < rect_pieces.length; piece++) {
                applyToRectangle(rect_pieces[piece], setHighlighted, false);
            }
            rect_pieces = getHollowRectangle(new_highlight);
            for (var piece = 0; piece < rect_pieces.length; piece++) {
                applyToRectangle(rect_pieces[piece], setHighlighted, true);
            }
            var selectionstatus = document.getElementById('selectionstatus');
            if (new_highlight.getHeight() > 1 || new_highlight.getWidth() > 1) {
                selectionstatus.textContent = 'Highlight: ' +
                    new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            } else {
                selectionstatus.textContent = '';
            }
        }

        function writeToCell(cell: Cell, character: string): void {
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
                console.log('highlighted');
            }
        }
    }
}
