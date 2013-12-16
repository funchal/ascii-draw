'use strict';

module ascii_draw
{
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Command = commands.Command;
    import Cell = grid.Cell;
    export class RectangleCommand implements Command
    {
        save_selection: Array<Rectangle> = [];
        completed: boolean = false;

        initiate(pos: CellPosition)
        {
            // FIXME: set begin_selection at parent function
            this.save_selection = selection.set([]);
            this.resetHighlight(pos);
            var cell = grid.getCell(grid.getRow(pos.row), pos.col);
            grid.writeToCell(cell, '+');
            var selectionstatus = document.getElementById('selectionstatus');
            selectionstatus.textContent = 'Highlight: 1x1';
        }

        change(pos: CellPosition): void
        {
            // FIXME: set end_selection at parent function
            if (!this.completed) {

                // FIXME: move this to parent function
                if (pos.isEqual(end_highlight)) {
                    return;
                }

                this.updateRectangleAndHighlight(pos);

                end_highlight = pos;

                // update status bar
                var new_highlight = new Rectangle(begin_highlight,
                                                  end_highlight,
                                                  true /* normalize */);
                var selectionstatus = document.getElementById('selectionstatus');
                selectionstatus.textContent = 'Highlight: ' +
                        new_highlight.getHeight() + 'x' + new_highlight.getWidth();

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

        fillArrayWithRectangle(array: Array<Array<string>>, rect: Rectangle): void
        {
            for (var r = 0; r < grid.nrows; r++) {
                array[r] = new Array(grid.ncols);
                for (var c = 0; c < grid.ncols; c++) {
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
        }

        /* Clear previous selection and paint new selection
        */
        updateRectangleAndHighlight(new_end_highlight: CellPosition): void
        {
            var grid_old: Array<Array<string>> = new Array(grid.nrows);
            this.fillArrayWithRectangle(grid_old, new Rectangle(begin_highlight, end_highlight, true));
            var grid_new: Array<Array<string>> = new Array(grid.nrows);
            this.fillArrayWithRectangle(grid_new, new Rectangle(begin_highlight, new_end_highlight, true));

            for (var r = 0; r < grid.nrows; r++) {
                var row: grid.Row = null;
                for (var c = 0; c < grid.ncols; c++) {
                    var old_content = grid_old[r][c];
                    var new_content = grid_new[r][c];
                    if (new_content == old_content) {
                        continue;
                    }
                    if (row == null) {
                        row = grid.getRow(r);
                    }
                    var cell = grid.getCell(row, c);
                    if (new_content == null) {
                        var character = cell['data-committed-content'];
                        grid.writeToCell(cell, character);
                        setHighlighted(cell, false);
                    } else {
                        grid.writeToCell(cell, new_content);
                        if (old_content == null) {
                            setHighlighted(cell, true);
                        }
                    }
                }
            }
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
