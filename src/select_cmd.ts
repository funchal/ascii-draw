'use strict';

module ascii_draw
{
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Command = commands.Command;

    export class SelectCommand implements Command
    {
        save_selection: Array<Rectangle> = [];
        completed: boolean = false;

        initiate(pos: CellPosition)
        {
            this.save_selection = selection.set([]);
            this.setHighlight(pos, pos);
        }

        change(pos: CellPosition): void
        {
            if (!this.completed) {
                this.setHighlight(begin_highlight, pos);
            }
        }

        complete(): void
        {
            var new_selection = new Rectangle(begin_highlight, end_highlight, true /*normalize*/);
            this.setHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
            selection.set([new_selection]);
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

        setHighlight(new_begin_highlight: CellPosition, new_end_highlight: CellPosition): void
        {
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
    }
}