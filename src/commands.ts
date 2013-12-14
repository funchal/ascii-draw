///<reference path='utils.ts'/>

'use strict';

module ascii_draw {
    export module commands {
        import Rectangle = utils.Rectangle;

        var history: Array<Command> = [];
        var limit = 100;
        var current = 0;

        var redo_button: HTMLButtonElement;
        var undo_button: HTMLButtonElement;

        export interface Command {
            execute(): void;
            unexecute(): void;
        }

        export class ReplaceSelection implements Command {
            constructor(public save_selection: Array<Rectangle>) {}

            execute(): void {
                console.log('execute ReplaceSelection');
                this.save_selection = selection.set(this.save_selection);
            }

            unexecute(): void {
                console.log('unexecute ReplaceSelection');
                this.save_selection = selection.set(this.save_selection);
            }
        }

        export class FillSelection implements Command {
            constructor(public character: string) {}

            save_raw_contents: string;

            execute(): void {
                console.log('execute FillSelection');
                // FIXME: save_raw_contents = selection.getRawContents();
                for (var i = 0; i < selection.contents.length; i++) {
                    applyToRectangle(selection.contents[i], grid.writeToCell, this.character);
                }

                if (selection.isUnit()) {
                    selection.move(0, 1);
                }
            }

            unexecute(): void {
                console.log('unexecute FillSelection');
                if (selection.isUnit()) {
                    selection.move(0, -1);
                }

                for (var i = 0; i < selection.contents.length; i++) {
                    applyToRectangle(selection.contents[i], grid.writeToCell, ' ');
                }
            }
        }

        export function init(): void {
            undo_button = <HTMLButtonElement>document.getElementById('undo-button');
            redo_button = <HTMLButtonElement>document.getElementById('redo-button');
            update();
            undo_button.addEventListener('click', onUndo, false);
            redo_button.addEventListener('click', onRedo, false);
        }

        export function invoke(cmd: Command): void {
            history.splice(current, history.length - current, cmd);
            if (history.length > limit) {
                history.shift();
                current--;
            }
            redo();
        }

        export function onUndo(): void {
            if (canUndo()) {
                undo();
            }
        }

        export function onRedo(): void {
            if (canRedo()) {
                redo();
            }
        }

        function undo(): void {
            current--;
            history[current].unexecute();
            update();
        }

        function redo(): void {
            current++;
            history[current-1].execute();
            update();
        }

        function canUndo(): boolean {
            return (current > 0);
        }

        function canRedo(): boolean {
            return (current < history.length);
        }

        function update(): void {
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
    }
}