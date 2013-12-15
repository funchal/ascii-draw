'use strict';

module ascii_draw
{
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Command = commands.Command;

    export class FillCommand implements Command
    {
        character: string;

        initiate(pos: CellPosition) {}
        change(pos: CellPosition) {}

        complete()
        {
            this.redo();
        }

        cancel(): void {}

        undo(): void
        {
            for (var i = 0; i < selection.contents.length; i++) {
                applyToRectangle(selection.contents[i], grid.writeToCell, grid.emptyCell);
            }
        }

        redo(): void
        {
            for (var i = 0; i < selection.contents.length; i++) {
                applyToRectangle(selection.contents[i], grid.writeToCell, this.character);
            }
        }
    }
}