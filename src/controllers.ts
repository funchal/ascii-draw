///<reference path='utils.ts'/>
///<reference path='grid.ts'/>
///<reference path='selection.ts'/>
///<reference path='commands.ts'/>
///<reference path='selectcontroller.ts'/>

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
            onMouseUp(target: Cell): void;
            onMouseOver(pos: CellPosition): void;
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

            export function onMouseUp(target: Cell): void {
                if (highlighting) {
                    if (target) {
                        var pos = grid.getCellPosition(target);
                        asyncMouseOver(pos);
                    }
                    var new_selection = setHollowHighlight(new CellPosition(0, 0),
                                                           new CellPosition(0, 0));
                    highlighting = false;

                    commands.invoke(new commands.ReplaceSelection(new_selection));
                }
            }

            function asyncMouseOver(pos: CellPosition) {
                if (highlighting) {
                    updateRectangleAndHighlight(pos);
                }
            }

            export function onMouseOver(pos: CellPosition): void {
                if (highlighting) {
                    window.setTimeout(asyncMouseOver.bind(undefined, pos), 0);
                }
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

            /* Return the interval of cells that are in [begin, change[
            but not in [begin, keep[.

            Examples:

            begin keep change       keep  begin change       begin change keep
              |     |     |           |     |     |            |      |     |
              v     v     v           v     v     v            v      v     v
                    IIIIII                   IIIII

            */
            function getAdjacentEdge(begin: number,
                                     keep: number,
                                     change: number): Array<number>
            {
                var interval: Array<number>;
                if (change < begin && change < keep) {
                    interval = [change + 1, Math.min(begin - 1, keep)];
                } else if (change > begin && change > keep) {
                    interval = [Math.max(begin + 1, keep), change - 1];
                } // else change is between begin and keep, nothing to change.

                if (interval && interval[0] <= interval[1]) {
                    return interval;
                } else {
                    return null;
                }
            }

            function updateCorners(begin: CellPosition,
                                   end: CellPosition,
                                   paint: boolean): void
            {
                var character: string;
                if (paint) {
                    character = '+';
                } else {
                    character = emptyCell;
                }

                var row = grid.getRow(begin.row);

                var cell = grid.getCell(row, begin.col);
                writeToCell(cell, character);
                setHighlighted(cell, paint);

                cell = grid.getCell(row, end.col);
                writeToCell(cell, character);
                setHighlighted(cell, paint);

                row = grid.getRow(end.row);

                cell = grid.getCell(row, begin.col);
                writeToCell(cell, character);
                setHighlighted(cell, paint);

                cell = grid.getCell(row, end.col);
                writeToCell(cell, character);
                setHighlighted(cell, paint);

            }

            /* Paint or clear a flat rectangle.

            paintEdge([10, 20], 3, true, true) fills the col 3 from row 10
            to row 20 with '|' and highlights the area.
            */
            function paintEdge(interval: Array<number>,
                               missing_coord: number,
                               vertical: boolean,
                               paint: boolean): void
            {
                if (interval) {

                    if (vertical) {
                        var character: string;
                        if (paint) {
                            character = '|';
                        } else {
                            character = emptyCell;
                        }
                        for (var r = interval[0]; r <= interval[1]; r++) {
                            var row = grid.getRow(r);
                            var cell = grid.getCell(row, missing_coord);
                            writeToCell(cell, character);
                            setHighlighted(cell, paint);
                        }
                    } else {
                        var character: string;
                        if (paint) {
                            character = '-';
                        } else {
                            character = emptyCell;
                        }
                        var row = grid.getRow(missing_coord);
                        for (var c = interval[0]; c <= interval[1]; c++) {
                            var cell = grid.getCell(row, c);
                            writeToCell(cell, character);
                            setHighlighted(cell, paint);
                        }
                    }
                }
            }

            /*
            getInnerInterval(20, 10) returns [11, 19].
            */
            function getInnerInterval(val1: number, val2:number): Array<number>
            {
                return [Math.min(val1, val2) + 1,
                        Math.max(val1, val2) - 1];
            }

            function updateRectangleAndHighlight(new_end_highlight: CellPosition): Array<Rectangle>
            {

                if (new_end_highlight.isEqual(end_highlight)) {
                    return;
                }

                // clear

                updateCorners(begin_highlight, end_highlight, false /* paint */);

                var clear: Array<number>;

                // adjacent horizontal
                clear = getAdjacentEdge(begin_highlight.col,
                                        new_end_highlight.col, /* keep */
                                        end_highlight.col); /* change */
                paintEdge(clear,
                          begin_highlight.row,
                          false /* vertical */,
                          false /* paint */);

                // opposite horizontal
                // don't clear the opposite edge if it overlaps with the adjacent edge
                if (begin_highlight.row != end_highlight.row) {

                    if (new_end_highlight.row != end_highlight.row) {
                        // The edge is on a new row. Update the entire edge.
                        clear = getInnerInterval(begin_highlight.col, end_highlight.col);
                    }
                    // else: The edge is still on the same row.
                    // Only update the part of the edge that changed. This is
                    // the same interval as the adjacent horizontal case.

                    paintEdge(clear, end_highlight.row, false, false);
                }

                // adjacent vertical
                clear = getAdjacentEdge(begin_highlight.row,
                                        new_end_highlight.row,
                                        end_highlight.row);
                paintEdge(clear, begin_highlight.col, true, false);

                // opposite vertical
                if (begin_highlight.col != end_highlight.col) {
                    if (new_end_highlight.col != end_highlight.col) {
                        clear = getInnerInterval(begin_highlight.row, end_highlight.row);
                    }
                    paintEdge(clear, end_highlight.col, true, false);
                }

                // paint

                updateCorners(begin_highlight, new_end_highlight, true);

                var paint: Array<number>;

                // adjacent horizontal
                paint = getAdjacentEdge(begin_highlight.col,
                                        end_highlight.col,
                                        new_end_highlight.col);
                paintEdge(paint, begin_highlight.row, false, true);

                // opposite horizontal
                if (new_end_highlight.row != end_highlight.row) {
                    paint = getInnerInterval(begin_highlight.col, new_end_highlight.col);
                }
                paintEdge(paint, new_end_highlight.row, false, true);

                // adjacent vertical
                paint = getAdjacentEdge(begin_highlight.row,
                                        end_highlight.row,
                                        new_end_highlight.row);
                paintEdge(paint, begin_highlight.col, true, true);

                // opposite vertical
                if (new_end_highlight.col != end_highlight.col) {
                    paint = getInnerInterval(begin_highlight.row, new_end_highlight.row);
                }
                paintEdge(paint, new_end_highlight.col, true, true);

                end_highlight = new_end_highlight;
            }
        }

        export var begin_highlight: CellPosition = new CellPosition(0, 0);
        export var end_highlight: CellPosition = begin_highlight;

        export var highlighting = false;

        export var current: Controller = SelectController;

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
                //console.log('highlighted already set to ' + highlighted);
            }
        }
    }
}
