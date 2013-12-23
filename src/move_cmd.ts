///<reference path='selection.ts'/>

'use strict';

module ascii_draw
{
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Command = commands.Command;

    export class MoveCommand implements Command
    {
        dx: number = 0;
        dy: number = 0;
        completed: boolean = false;

        initiate(pos: CellPosition)
        {
            begin_highlight = pos;
            end_highlight = pos;
        }

        change(pos: CellPosition): void
        {
            if (!this.completed) {
                this.dx = pos.row - end_highlight.row;
                this.dy = pos.col - end_highlight.col;
                end_highlight = pos;

                this.moveContents();
                selection.move(this.dx, this.dy);
            }
        }

        complete(): void
        {
            this.dx = end_highlight.row - begin_highlight.row;
            this.dy = end_highlight.col - begin_highlight.col;
            this.completed = true;
        }

        cancel(): void
        {
        }

        undo(): void
        {
            selection.move(-this.dx, -this.dy);
        }

        redo(): void
        {
            selection.move(this.dx, this.dy);
        }

        moveContents(): void
        {
            var grid_old: Array<Array<string>> = new Array(grid.nrows);
            for (var r = 0; r < grid.nrows; r++) {
                grid_old[r] = new Array(grid.ncols);
                for (var c = 0; c < grid.ncols; c++) {
                    grid_old[r][c] = null;
                }
            }
            var grid_new: Array<Array<string>> = new Array(grid.nrows);
            for (var r = 0; r < grid.nrows; r++) {
                grid_new[r] = new Array(grid.ncols);
                for (var c = 0; c < grid.ncols; c++) {
                    grid_new[r][c] = null;
                }
            }

            for (var s = 0; s < selection.contents.length; s++) {
                var rect = selection.contents[s];
                for (var r = rect.top; r <= rect.bottom; r++) {
                    var row = grid.getRow(r);
                    for (var c = rect.left; c <= rect.right; c++) {
                        var cell = grid.getCell(row, c);
                        var cell_contents = cell.textContent;
                        grid_old[r][c] = cell_contents;
                        // TODO: check grid bounds
                        grid_new[r+this.dx][c+this.dy] = cell_contents;
                    }
                }
            }

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
                    } else {
                        grid.writeToCell(cell, new_content);
                    }
                }
            }
                         
        }
    }
}
