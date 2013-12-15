///<reference path='utils.ts'/>

'use strict';

module ascii_draw
{
    export module commands
    {
        import Rectangle = utils.Rectangle;
        import CellPosition = utils.Point;

        export interface Command
        {
            initiate(pos: CellPosition): void;
            change(pos: CellPosition): void;
            complete(): void;
            cancel(): void;
            undo(): void;
            redo(): void;
        }

        var history: Array<Command> = [];
        var limit = 100;
        var current = 0;

        var redo_button: HTMLButtonElement;
        var undo_button: HTMLButtonElement;

        export var pending: Command = null;

        export function init(): void
        {
            undo_button = <HTMLButtonElement>document.getElementById('undo-button');
            redo_button = <HTMLButtonElement>document.getElementById('redo-button');
            update();
            undo_button.addEventListener('click', onUndo, false);
            redo_button.addEventListener('click', onRedo, false);
        }

        export function complete(cmd: Command): void
        {
            commitSelection();
            history.splice(current, history.length - current, cmd);
            if (history.length > limit) {
                history.shift();
                current--;
            }
            current++;
            update();
        }

        export function onUndo(): void
        {
            if (canUndo()) {
                undo();
            }
        }

        export function onRedo(): void
        {
            if (canRedo()) {
                redo();
            }
        }

        function undo(): void
        {
            current--;
            history[current].undo();
            update();
        }

        function redo(): void
        {
            current++;
            history[current-1].redo();
            update();
        }

        function canUndo(): boolean
        {
            return (current > 0);
        }

        function canRedo(): boolean
        {
            return (current < history.length);
        }

        function update(): void
        {
            if (canUndo()) {
                undo_button.disabled = false;
            } else {
                undo_button.disabled = true;
            }

            if (canRedo()) {
                redo_button.disabled = false;
            } else {
                redo_button.disabled = true;
            }
        }

        function commitSelection(): void
        {
            var selection_contents = selection.contents;
            for (var i = 0; i < selection_contents.length; i++) {
                for (var r = 0; r < selection_contents[i].getHeight(); r++) {
                    var row = grid.getRow(selection_contents[i].top + r);
                    for (var c = 0; c < selection_contents[i].getWidth(); c++) {
                        var cell = grid.getCell(row, selection_contents[i].left + c);
                        cell['data-committed-content'] = cell.textContent;
                    }
                }
            }
        }

    }
}
