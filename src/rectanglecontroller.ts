module ascii_draw {
    export module controllers {
        export module RectangleController {
            import Rectangle = utils.Rectangle;
            import CellPosition = utils.Point;
            import Cell = grid.Cell;

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
                commands.invoke(new commands.ReplaceSelection());
                highlighting = true;

                var pos = grid.getCellPosition(target);
                resetHighlight(pos);

                grid.writeToCell(target, '+');

                var selectionstatus = document.getElementById('selectionstatus');
                selectionstatus.textContent = 'Highlight: 1x1';
            }

            export function onMouseUp(target: Cell): void {
                if (highlighting) {
                    highlighting = false;

                    if (target) {
                        var pos = grid.getCellPosition(target);
                        asyncMouseOver(pos);
                    }
                    var new_selection = resetHighlight(new CellPosition(0, 0));
                    selection.set(new_selection);
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
                    character = grid.emptyCell;
                }

                var row = grid.getRow(begin.row);

                var cell = grid.getCell(row, begin.col);
                grid.writeToCell(cell, character);
                setHighlighted(cell, paint);

                cell = grid.getCell(row, end.col);
                grid.writeToCell(cell, character);
                setHighlighted(cell, paint);

                row = grid.getRow(end.row);

                cell = grid.getCell(row, begin.col);
                grid.writeToCell(cell, character);
                setHighlighted(cell, paint);

                cell = grid.getCell(row, end.col);
                grid.writeToCell(cell, character);
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
                            character = grid.emptyCell;
                        }
                        for (var r = interval[0]; r <= interval[1]; r++) {
                            var row = grid.getRow(r);
                            var cell = grid.getCell(row, missing_coord);
                            grid.writeToCell(cell, character);
                            setHighlighted(cell, paint);
                        }
                    } else {
                        var character: string;
                        if (paint) {
                            character = '-';
                        } else {
                            character = grid.emptyCell;
                        }
                        var row = grid.getRow(missing_coord);
                        for (var c = interval[0]; c <= interval[1]; c++) {
                            var cell = grid.getCell(row, c);
                            grid.writeToCell(cell, character);
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

            /* Clear previous selection, paint new selection, update begin/end
            selection and selectionstatus.
            */
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

                // update status bar
                var new_highlight = new Rectangle(begin_highlight,
                                                  end_highlight,
                                                  true /* normalize */);
                var selectionstatus = document.getElementById('selectionstatus');
                selectionstatus.textContent = 'Highlight: ' +
                        new_highlight.getHeight() + 'x' + new_highlight.getWidth();
            }

            function resetHighlight(new_position: CellPosition): Array<Rectangle> {
                // un-highlight previous selection
                var selection = getHollowRectangle(new Rectangle(begin_highlight,
                                                                 end_highlight,
                                                                 true));
                for (var i = 0; i < selection.length ; i++) {
                    applyToRectangle(selection[i], setHighlighted, false);
                }

                // update position
                begin_highlight = new_position;
                end_highlight = new_position;

                // highlight position
                var cell = grid.getCell(grid.getRow(new_position.row), new_position.col);
                setHighlighted(cell, true);

                return selection;
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
        }
    }
}
