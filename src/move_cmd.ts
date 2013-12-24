///<reference path='selection.ts'/>

'use strict';

module ascii_draw
{
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Command = commands.Command;

    export class MoveCommand implements Command
    {
        // shift since last call to change()
        dx: number = 0;
        dy: number = 0;
        // shift since last call to initiate()
        total_dx: number = 0;
        total_dy: number = 0;

        completed: boolean = false;
        initial_selection: Array<Array<string>> = null;
        move_contents: boolean = true;

        initiate(pos: CellPosition)
        {
            begin_highlight = pos;
            end_highlight = pos;

            this.total_dx = 0;
            this.total_dy = 0;

            if (this.move_contents) {
                this.backup_contents();
            }
        }

        change(pos: CellPosition): void
        {
            if (!this.completed) {
                this.dx = pos.row - end_highlight.row;
                this.dy = pos.col - end_highlight.col;
                end_highlight = pos;

                if (this.move_contents) {
                    this.moveContents();
                }
                selection.move(this.dx, this.dy);

                this.total_dx += this.dx;
                this.total_dy += this.dy;
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

        getContent(row: number, col: number) {
            if (0 <= row && row < grid.nrows && 0 <= col && col < grid.ncols) {
                return this.initial_selection[row][col];
            } else {
                return null;
            }
        }

        moveContents(): void
        {
            for (var r = 0; r < grid.nrows; r++) {
                var row: grid.Row = null;
                for (var c = 0; c < grid.ncols; c++) {
                    var old_content = this.getContent(r - this.total_dx, 
                                                      c - this.total_dy);
                    var new_content = this.getContent(r - this.total_dx - this.dx,
                                                      c - this.total_dy - this.dy);

                    if (new_content == old_content) {
                        continue;
                    }
                    if (row == null) {
                        row = grid.getRow(r);
                    }
                    var cell = grid.getCell(row, c);
                    if (new_content == null) {
                        // restore
                        var character = cell['data-committed-content'];
                        grid.writeToCell(cell, character);
                    } else {
                        // override
                        grid.writeToCell(cell, new_content);
                    }
                }
            }
        }

        backup_contents(): void {
            // copy selection contents and commit emptyCell to selected cells
            this.initial_selection = new Array(grid.nrows);
            for (var r = 0; r < grid.nrows; r++) {
                this.initial_selection[r] = new Array(grid.ncols);
                for (var c = 0; c < grid.ncols; c++) {
                    this.initial_selection[r][c] = null;
                }
            }
            for (var s = 0; s < selection.contents.length; s++) {
                var rect = selection.contents[s];
                for (var r = rect.top; r <= rect.bottom; r++) {
                    var row = grid.getRow(r);
                    for (var c = rect.left; c <= rect.right; c++) {
                        var cell = grid.getCell(row, c);
                        this.initial_selection[r][c] = cell.textContent;
                        cell['data-committed-content'] = grid.emptyCell;
                    }
                }
            }
        }

    }
}
