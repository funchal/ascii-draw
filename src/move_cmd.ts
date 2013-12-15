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
                selection.move(this.dx, this.dy);
                // FIXME: move contents
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
    }
}
