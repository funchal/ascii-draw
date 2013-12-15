module ascii_draw {
    export module controllers {
        export module SelectController {
            import Rectangle = utils.Rectangle;
            import CellPosition = utils.Point;
            import Cell = grid.Cell;

            export function activate(): void {
                console.log('activate SelectController');
                utils.addClass(selection_button, 'pressed');
            }

            export function deactivate(): void {
                console.log('deactivate SelectController');
                utils.removeClass(selection_button, 'pressed');
            }

            export function onMouseDown(target: Cell): void {
                // TODO: if current cell is highlighted change to move mode

                // save old selection and create a pending command
                commands.invoke(new commands.ReplaceSelection());

                highlighting = true;
                setHighlight(grid.getCellPosition(target), grid.getCellPosition(target));
            }

            export function onMouseUp(target: Cell): void {
                if (highlighting) {
                    if (target) {
                        var pos = grid.getCellPosition(target);
                        asyncMouseOver(pos);
                    }

                    var new_selection = new Rectangle(begin_highlight, end_highlight, true /*normalize*/);
                    setHighlight(new CellPosition(0, 0), new CellPosition(0, 0));
                    highlighting = false;

                    selection.set([new_selection]);
                }
            }

            function asyncMouseOver(pos: CellPosition): void {
                if (highlighting) {
                    setHighlight(begin_highlight, pos);
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

                commands.invoke(new commands.FillSelection(character));
            }
        }
    }
}
