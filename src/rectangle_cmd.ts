'use strict';

module ascii_draw
{
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Command = commands.Command;

    export class RectangleCommand implements Command
    {
        save_selection: Array<Rectangle> = [];
        completed: boolean = false;

        initiate(pos: CellPosition)
        {
            this.save_selection = selection.set([]);
            this.resetHighlight(pos);
            var cell = grid.getCell(grid.getRow(pos.row), pos.col);;
            grid.writeToCell(cell, '+');
            var selectionstatus = document.getElementById('selectionstatus');
            selectionstatus.textContent = 'Highlight: 1x1';
        }

        change(pos: CellPosition): void
        {
            if (!this.completed) {
                this.updateRectangleAndHighlight(pos);
            }
        }

        complete(): void
        {
            var new_selection = this.resetHighlight(new CellPosition(0, 0));
            selection.set(new_selection);
            this.completed = true;
        }

        cancel(): void
        {
        }

        undo(): void
        {
            this.save_selection = selection.set(this.save_selection);
        }

        redo(): void
        {
            this.save_selection = selection.set(this.save_selection);
        }

        /* Return the interval of cells that are in [begin, change[
        but not in [begin, keep[.

        Examples:

        begin keep change       keep  begin change       begin change keep
          |     |     |           |     |     |            |      |     |
          v     v     v           v     v     v            v      v     v
                IIIIII                   IIIII

        */
        getAdjacentEdge(begin: number, keep: number, change: number): Array<number>
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

        updateCorners(begin: CellPosition, end: CellPosition, paint: boolean): void
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
        paintEdge(interval: Array<number>, missing_coord: number, vertical: boolean, paint: boolean): void
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
        getInnerInterval(val1: number, val2:number): Array<number>
        {
            return [Math.min(val1, val2) + 1,
                    Math.max(val1, val2) - 1];
        }

        /* Clear previous selection, paint new selection, update begin/end
        selection and selectionstatus.
        */
        updateRectangleAndHighlight(new_end_highlight: CellPosition): void
        {
            if (new_end_highlight.isEqual(end_highlight)) {
                return;
            }

            // clear

            this.updateCorners(begin_highlight, end_highlight, false /* paint */);

            var clear: Array<number>;

            // adjacent horizontal
            clear = this.getAdjacentEdge(begin_highlight.col,
                                    new_end_highlight.col, /* keep */
                                    end_highlight.col); /* change */
            this.paintEdge(clear,
                      begin_highlight.row,
                      false /* vertical */,
                      false /* paint */);

            // opposite horizontal
            // don't clear the opposite edge if it overlaps with the adjacent edge
            if (begin_highlight.row != end_highlight.row) {

                if (new_end_highlight.row != end_highlight.row) {
                    // The edge is on a new row. Update the entire edge.
                    clear = this.getInnerInterval(begin_highlight.col, end_highlight.col);
                }
                // else: The edge is still on the same row.
                // Only update the part of the edge that changed. This is
                // the same interval as the adjacent horizontal case.

                this.paintEdge(clear, end_highlight.row, false, false);
            }

            // adjacent vertical
            clear = this.getAdjacentEdge(begin_highlight.row,
                                    new_end_highlight.row,
                                    end_highlight.row);
            this.paintEdge(clear, begin_highlight.col, true, false);

            // opposite vertical
            if (begin_highlight.col != end_highlight.col) {
                if (new_end_highlight.col != end_highlight.col) {
                    clear = this.getInnerInterval(begin_highlight.row, end_highlight.row);
                }
                this.paintEdge(clear, end_highlight.col, true, false);
            }

            // paint

            this.updateCorners(begin_highlight, new_end_highlight, true);

            var paint: Array<number>;

            // adjacent horizontal
            paint = this.getAdjacentEdge(begin_highlight.col,
                                    end_highlight.col,
                                    new_end_highlight.col);
            this.paintEdge(paint, begin_highlight.row, false, true);

            // opposite horizontal
            if (new_end_highlight.row != end_highlight.row) {
                paint = this.getInnerInterval(begin_highlight.col, new_end_highlight.col);
            }
            this.paintEdge(paint, new_end_highlight.row, false, true);

            // adjacent vertical
            paint = this.getAdjacentEdge(begin_highlight.row,
                                    end_highlight.row,
                                    new_end_highlight.row);
            this.paintEdge(paint, begin_highlight.col, true, true);

            // opposite vertical
            if (new_end_highlight.col != end_highlight.col) {
                paint = this.getInnerInterval(begin_highlight.row, new_end_highlight.row);
            }
            this.paintEdge(paint, new_end_highlight.col, true, true);

            end_highlight = new_end_highlight;

            // update status bar
            var new_highlight = new Rectangle(begin_highlight,
                                              end_highlight,
                                              true /* normalize */);
            var selectionstatus = document.getElementById('selectionstatus');
            selectionstatus.textContent = 'Highlight: ' +
                    new_highlight.getHeight() + 'x' + new_highlight.getWidth();
        }

        resetHighlight(new_position: CellPosition): Array<Rectangle>
        {
            // un-highlight previous selection
            var selection = this.getHollowRectangle(new Rectangle(begin_highlight,
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

        getHollowRectangle(rect: Rectangle): Array<Rectangle>
        {
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